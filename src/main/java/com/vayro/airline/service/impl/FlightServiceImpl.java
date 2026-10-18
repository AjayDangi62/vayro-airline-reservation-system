package com.vayro.airline.service.impl;

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
import com.vayro.airline.service.FlightService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

@Service
public class FlightServiceImpl implements FlightService {

    private final FlightRepository flightRepository;
    private final FlightMapper flightMapper;

    public FlightServiceImpl(FlightRepository flightRepository, FlightMapper flightMapper) {
        this.flightRepository = flightRepository;
        this.flightMapper = flightMapper;
    }

    @Override
    @Transactional
    public FlightResponse createFlight(FlightRequest request) {
        validateFlightScheduleAndRoute(request.getSource(), request.getDestination(),
                request.getDepartureTime(), request.getArrivalTime());

        String flightNum = request.getFlightNumber().trim().toUpperCase();
        if (flightRepository.existsByFlightNumber(flightNum)) {
            throw new DuplicateResourceException("Flight with number '" + flightNum + "' already exists.");
        }

        Flight flight = flightMapper.toEntity(request);
        Flight savedFlight = flightRepository.save(flight);
        return flightMapper.toResponse(savedFlight);
    }

    @Override
    @Transactional
    public FlightResponse updateFlight(Long id, FlightRequest request) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));

        validateFlightScheduleAndRoute(request.getSource(), request.getDestination(),
                request.getDepartureTime(), request.getArrivalTime());

        String flightNum = request.getFlightNumber().trim().toUpperCase();
        if (!flight.getFlightNumber().equalsIgnoreCase(flightNum) && flightRepository.existsByFlightNumber(flightNum)) {
            throw new DuplicateResourceException("Flight with number '" + flightNum + "' already exists.");
        }

        int bookedSeats = flight.getTotalSeats() - flight.getAvailableSeats();
        if (request.getTotalSeats() < bookedSeats) {
            throw new BadRequestException("Cannot set total seats (" + request.getTotalSeats()
                    + ") lower than the currently reserved seats (" + bookedSeats + ").");
        }

        flight.setFlightNumber(flightNum);
        flight.setAirlineName(request.getAirlineName().trim());
        flight.setSource(request.getSource().trim().toUpperCase());
        flight.setDestination(request.getDestination().trim().toUpperCase());
        flight.setDepartureTime(request.getDepartureTime());
        flight.setArrivalTime(request.getArrivalTime());
        flight.setPrice(request.getPrice());
        flight.setTotalSeats(request.getTotalSeats());
        flight.setAvailableSeats(request.getTotalSeats() - bookedSeats);

        Flight updated = flightRepository.save(flight);
        return flightMapper.toResponse(updated);
    }

    @Override
    @Transactional
    public FlightResponse updateFlightStatus(Long id, FlightStatus status) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));

        flight.setStatus(status);
        Flight updated = flightRepository.save(flight);
        return flightMapper.toResponse(updated);
    }

    @Override
    @Transactional(readOnly = true)
    public FlightResponse getFlightById(Long id) {
        Flight flight = flightRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + id));
        return flightMapper.toResponse(flight);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FlightResponse> searchFlights(String source, String destination, LocalDate travelDate,
                                                     int minSeats, int page, int size, String sortBy, String sortDir) {
        if (source == null || source.trim().isEmpty()) {
            throw new BadRequestException("Source airport or city is required for search.");
        }
        if (destination == null || destination.trim().isEmpty()) {
            throw new BadRequestException("Destination airport or city is required for search.");
        }
        if (source.trim().equalsIgnoreCase(destination.trim())) {
            throw new BadRequestException("Source and destination must not be identical.");
        }
        if (travelDate == null) {
            throw new BadRequestException("Travel date is required.");
        }
        if (minSeats < 1) {
            minSeats = 1;
        }

        LocalDateTime startTime = travelDate.atStartOfDay();
        LocalDateTime endTime = travelDate.atTime(23, 59, 59);

        Sort sort = Sort.by(Sort.Direction.fromString(sortDir.equalsIgnoreCase("desc") ? "DESC" : "ASC"),
                sanitizeSortBy(sortBy));
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), sort);

        List<FlightStatus> bookableStatuses = Arrays.asList(FlightStatus.SCHEDULED, FlightStatus.ACTIVE);

        Page<Flight> flightPage = flightRepository.searchFlights(
                source.trim(),
                destination.trim(),
                startTime,
                endTime,
                minSeats,
                bookableStatuses,
                pageable
        );

        List<FlightResponse> responses = flightPage.getContent().stream()
                .map(flightMapper::toResponse)
                .toList();

        return PageResponse.of(flightPage, responses);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<FlightResponse> getAllFlights(int page, int size, String sortBy, String sortDir) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir.equalsIgnoreCase("desc") ? "DESC" : "ASC"),
                sanitizeSortBy(sortBy));
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), sort);

        Page<Flight> flightPage = flightRepository.findAll(pageable);
        List<FlightResponse> responses = flightPage.getContent().stream()
                .map(flightMapper::toResponse)
                .toList();

        return PageResponse.of(flightPage, responses);
    }

    private void validateFlightScheduleAndRoute(String source, String destination,
                                                LocalDateTime departureTime, LocalDateTime arrivalTime) {
        if (source.trim().equalsIgnoreCase(destination.trim())) {
            throw new BadRequestException("Source and destination cannot be identical.");
        }
        if (departureTime == null || arrivalTime == null) {
            throw new BadRequestException("Departure time and arrival time are required.");
        }
        if (!arrivalTime.isAfter(departureTime)) {
            throw new BadRequestException("Arrival time must be strictly after departure time.");
        }
    }

    private String sanitizeSortBy(String sortBy) {
        if (sortBy == null || sortBy.trim().isEmpty()) {
            return "departureTime";
        }
        return switch (sortBy.toLowerCase()) {
            case "price" -> "price";
            case "availableseats" -> "availableSeats";
            case "flightnumber" -> "flightNumber";
            case "airlinename" -> "airlineName";
            default -> "departureTime";
        };
    }
}
