package com.vayro.airline.service;

import com.vayro.airline.dto.BookingRequest;
import com.vayro.airline.dto.BookingResponse;
import com.vayro.airline.dto.PageResponse;
import com.vayro.airline.entity.Booking;
import com.vayro.airline.entity.Flight;
import com.vayro.airline.entity.User;
import com.vayro.airline.enums.BookingStatus;
import com.vayro.airline.enums.FlightStatus;
import com.vayro.airline.enums.Role;
import com.vayro.airline.exception.BadRequestException;
import com.vayro.airline.exception.BookingConflictException;
import com.vayro.airline.exception.InsufficientSeatsException;
import com.vayro.airline.exception.InvalidBookingStateException;
import com.vayro.airline.mapper.BookingMapper;
import com.vayro.airline.repository.BookingRepository;
import com.vayro.airline.repository.FlightRepository;
import com.vayro.airline.repository.UserRepository;
import com.vayro.airline.service.impl.BookingServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.security.access.AccessDeniedException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BookingServiceTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private FlightRepository flightRepository;

    @Mock
    private UserRepository userRepository;

    @Spy
    private BookingMapper bookingMapper = new BookingMapper();

    @InjectMocks
    private BookingServiceImpl bookingService;

    private User sampleUser;
    private Flight sampleFlight;
    private Booking sampleBooking;

    @BeforeEach
    void setUp() {
        sampleUser = new User("John Passenger", "john@example.com", "hash", "+1234567890", Role.USER);
        sampleUser.setId(1L);

        sampleFlight = new Flight("VY-202", "Vayro Air", "SFO", "HND",
                LocalDateTime.now().plusDays(10), LocalDateTime.now().plusDays(11),
                100, 100, new BigDecimal("500.00"), FlightStatus.SCHEDULED);
        sampleFlight.setId(20L);

        sampleBooking = new Booking("VAYRO-REF12345", sampleUser, sampleFlight, 2,
                new BigDecimal("1000.00"), BookingStatus.CONFIRMED);
        sampleBooking.setId(100L);
        sampleBooking.setBookedAt(LocalDateTime.now());
    }

    @Test
    @DisplayName("Should successfully create booking, decrement seats, calculate price, and return reference")
    void createBooking_Success() {
        BookingRequest request = new BookingRequest(20L, 2);

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));
        when(flightRepository.findById(20L)).thenReturn(Optional.of(sampleFlight));
        when(flightRepository.save(any(Flight.class))).thenAnswer(i -> i.getArgument(0));
        when(bookingRepository.existsByBookingReference(anyString())).thenReturn(false);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> {
            Booking b = i.getArgument(0);
            b.setId(101L);
            b.setBookedAt(LocalDateTime.now());
            return b;
        });

        BookingResponse response = bookingService.createBooking(request, "john@example.com");

        assertNotNull(response);
        assertTrue(response.getBookingReference().startsWith("VAYRO-"));
        assertEquals(2, response.getNumberOfPassengers());
        assertEquals(new BigDecimal("1000.00"), response.getTotalPrice());
        assertEquals(BookingStatus.CONFIRMED, response.getBookingStatus());
        assertEquals(98, sampleFlight.getAvailableSeats()); // 100 - 2

        verify(flightRepository).save(sampleFlight);
        verify(bookingRepository).save(any(Booking.class));
    }

    @Test
    @DisplayName("Should reject booking when requested passenger count exceeds available seats")
    void createBooking_InsufficientSeats() {
        sampleFlight.setAvailableSeats(1); // Only 1 seat left
        BookingRequest request = new BookingRequest(20L, 3); // Requesting 3

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));
        when(flightRepository.findById(20L)).thenReturn(Optional.of(sampleFlight));

        assertThrows(InsufficientSeatsException.class, () ->
                bookingService.createBooking(request, "john@example.com"));

        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    @DisplayName("Should reject booking for past flights")
    void createBooking_PastFlight() {
        sampleFlight.setDepartureTime(LocalDateTime.now().minusHours(2));
        BookingRequest request = new BookingRequest(20L, 1);

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));
        when(flightRepository.findById(20L)).thenReturn(Optional.of(sampleFlight));

        assertThrows(BadRequestException.class, () ->
                bookingService.createBooking(request, "john@example.com"));
    }

    @Test
    @DisplayName("Should reject booking for non-bookable flight status (e.g. CANCELLED)")
    void createBooking_CancelledFlight() {
        sampleFlight.setStatus(FlightStatus.CANCELLED);
        BookingRequest request = new BookingRequest(20L, 1);

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));
        when(flightRepository.findById(20L)).thenReturn(Optional.of(sampleFlight));

        assertThrows(BadRequestException.class, () ->
                bookingService.createBooking(request, "john@example.com"));
    }

    @Test
    @DisplayName("Should handle optimistic locking failure and throw BookingConflictException")
    void createBooking_OptimisticLockFailure() {
        BookingRequest request = new BookingRequest(20L, 2);

        when(userRepository.findByEmail("john@example.com")).thenReturn(Optional.of(sampleUser));
        when(flightRepository.findById(20L)).thenReturn(Optional.of(sampleFlight));
        when(flightRepository.save(any(Flight.class)))
                .thenThrow(new OptimisticLockingFailureException("Version mismatch"));

        assertThrows(BookingConflictException.class, () ->
                bookingService.createBooking(request, "john@example.com"));
    }

    @Test
    @DisplayName("Should successfully cancel booking and restore flight seats")
    void cancelBooking_Success() {
        sampleFlight.setAvailableSeats(98);

        when(bookingRepository.findByBookingReference("VAYRO-REF12345")).thenReturn(Optional.of(sampleBooking));
        when(flightRepository.save(any(Flight.class))).thenAnswer(i -> i.getArgument(0));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        BookingResponse response = bookingService.cancelBooking("VAYRO-REF12345", "john@example.com", false);

        assertNotNull(response);
        assertEquals(BookingStatus.CANCELLED, response.getBookingStatus());
        assertEquals(100, sampleFlight.getAvailableSeats()); // 98 + 2 seats restored

        verify(flightRepository).save(sampleFlight);
        verify(bookingRepository).save(sampleBooking);
    }

    @Test
    @DisplayName("Should prevent duplicate cancellation of an already cancelled booking")
    void cancelBooking_PreventDuplicateCancellation() {
        sampleBooking.setBookingStatus(BookingStatus.CANCELLED);

        when(bookingRepository.findByBookingReference("VAYRO-REF12345")).thenReturn(Optional.of(sampleBooking));

        assertThrows(InvalidBookingStateException.class, () ->
                bookingService.cancelBooking("VAYRO-REF12345", "john@example.com", false));

        verify(flightRepository, never()).save(any(Flight.class));
    }

    @Test
    @DisplayName("Should prevent non-admin user from cancelling another user's booking")
    void cancelBooking_ForbiddenForOtherUser() {
        when(bookingRepository.findByBookingReference("VAYRO-REF12345")).thenReturn(Optional.of(sampleBooking));

        assertThrows(AccessDeniedException.class, () ->
                bookingService.cancelBooking("VAYRO-REF12345", "intruder@example.com", false));
    }

    @Test
    @DisplayName("Should prevent non-admin user from viewing another user's booking")
    void getBookingByReference_ForbiddenForOtherUser() {
        when(bookingRepository.findByBookingReference("VAYRO-REF12345")).thenReturn(Optional.of(sampleBooking));

        assertThrows(AccessDeniedException.class, () ->
                bookingService.getBookingByReference("VAYRO-REF12345", "intruder@example.com", false));
    }
}
