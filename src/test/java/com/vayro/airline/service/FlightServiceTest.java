package com.vayro.airline.service;

import com.vayro.airline.dto.FlightRequest;
import com.vayro.airline.dto.FlightResponse;
import com.vayro.airline.dto.PageResponse;
import com.vayro.airline.entity.Flight;
import com.vayro.airline.enums.FlightStatus;
import com.vayro.airline.exception.BadRequestException;
import com.vayro.airline.exception.DuplicateResourceException;
import com.vayro.airline.exception.ResourceNotFoundException;
import com.vayro.airline.mapper.FlightMapper;
import com.vayro.airline.repository.FlightRepository;
import com.vayro.airline.service.impl.FlightServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FlightServiceTest {

    @Mock
    private FlightRepository flightRepository;

    @Spy
    private FlightMapper flightMapper = new FlightMapper();

    @InjectMocks
    private FlightServiceImpl flightService;

    private Flight sampleFlight;
    private LocalDateTime departure;
    private LocalDateTime arrival;

    @BeforeEach
    void setUp() {
        departure = LocalDateTime.now().plusDays(5);
        arrival = departure.plusHours(7);

        sampleFlight = new Flight("VY-101", "Vayro Air", "JFK", "LHR",
                departure, arrival, 180, 180, new BigDecimal("650.00"), FlightStatus.SCHEDULED);
        sampleFlight.setId(10L);
        sampleFlight.setCreatedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Should create flight successfully when parameters are valid")
    void createFlight_Success() {
        FlightRequest request = new FlightRequest("VY-101", "Vayro Air", "JFK", "LHR",
                departure, arrival, 180, new BigDecimal("650.00"));

        when(flightRepository.existsByFlightNumber("VY-101")).thenReturn(false);
        when(flightRepository.save(any(Flight.class))).thenReturn(sampleFlight);

        FlightResponse response = flightService.createFlight(request);

        assertNotNull(response);
        assertEquals("VY-101", response.getFlightNumber());
        assertEquals("JFK", response.getSource());
        assertEquals("LHR", response.getDestination());
        assertEquals(180, response.getAvailableSeats());
        assertEquals(FlightStatus.SCHEDULED, response.getStatus());
    }

    @Test
    @DisplayName("Should reject flight creation when flight number already exists")
    void createFlight_DuplicateNumber() {
        FlightRequest request = new FlightRequest("VY-101", "Vayro Air", "JFK", "LHR",
                departure, arrival, 180, new BigDecimal("650.00"));

        when(flightRepository.existsByFlightNumber("VY-101")).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> flightService.createFlight(request));
        verify(flightRepository, never()).save(any(Flight.class));
    }

    @Test
    @DisplayName("Should reject flight creation when source and destination are identical")
    void createFlight_IdenticalSourceAndDestination() {
        FlightRequest request = new FlightRequest("VY-101", "Vayro Air", "JFK", "JFK",
                departure, arrival, 180, new BigDecimal("650.00"));

        assertThrows(BadRequestException.class, () -> flightService.createFlight(request));
    }

    @Test
    @DisplayName("Should reject flight creation when arrival is before departure")
    void createFlight_InvalidTimes() {
        FlightRequest request = new FlightRequest("VY-101", "Vayro Air", "JFK", "LHR",
                arrival, departure, 180, new BigDecimal("650.00"));

        assertThrows(BadRequestException.class, () -> flightService.createFlight(request));
    }

    @Test
    @DisplayName("Should prevent reducing total seats below currently reserved seats")
    void updateFlight_CapacityConflict() {
        sampleFlight.setTotalSeats(100);
        sampleFlight.setAvailableSeats(40); // 60 seats already booked!

        when(flightRepository.findById(10L)).thenReturn(Optional.of(sampleFlight));

        FlightRequest request = new FlightRequest("VY-101", "Vayro Air", "JFK", "LHR",
                departure, arrival, 50, new BigDecimal("650.00")); // requested 50 < 60 booked

        assertThrows(BadRequestException.class, () -> flightService.updateFlight(10L, request));
    }

    @Test
    @DisplayName("Should update flight status successfully")
    void updateFlightStatus_Success() {
        when(flightRepository.findById(10L)).thenReturn(Optional.of(sampleFlight));
        when(flightRepository.save(any(Flight.class))).thenAnswer(invocation -> invocation.getArgument(0));

        FlightResponse response = flightService.updateFlightStatus(10L, FlightStatus.CANCELLED);

        assertNotNull(response);
        assertEquals(FlightStatus.CANCELLED, response.getStatus());
    }

    @Test
    @DisplayName("Should search available flights based on route, travel date, and minimum seats")
    void searchFlights_Success() {
        LocalDate travelDate = departure.toLocalDate();
        Page<Flight> page = new PageImpl<>(List.of(sampleFlight));

        when(flightRepository.searchFlights(eq("JFK"), eq("LHR"), any(LocalDateTime.class), any(LocalDateTime.class),
                eq(2), any(), any(Pageable.class))).thenReturn(page);

        PageResponse<FlightResponse> result = flightService.searchFlights("JFK", "LHR", travelDate,
                2, 0, 10, "departureTime", "asc");

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("VY-101", result.getContent().get(0).getFlightNumber());
    }

    @Test
    @DisplayName("Should reject search when source and destination are identical")
    void searchFlights_IdenticalEndpoints() {
        assertThrows(BadRequestException.class, () ->
                flightService.searchFlights("JFK", "JFK", LocalDate.now(), 1, 0, 10, "departureTime", "asc"));
    }
}
