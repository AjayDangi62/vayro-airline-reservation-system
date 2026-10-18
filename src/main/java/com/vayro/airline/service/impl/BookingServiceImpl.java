package com.vayro.airline.service.impl;

import com.vayro.airline.dto.BookingRequest;
import com.vayro.airline.dto.BookingResponse;
import com.vayro.airline.dto.PageResponse;
import com.vayro.airline.entity.Booking;
import com.vayro.airline.entity.Flight;
import com.vayro.airline.entity.User;
import com.vayro.airline.enums.BookingStatus;
import com.vayro.airline.exception.BadRequestException;
import com.vayro.airline.exception.BookingConflictException;
import com.vayro.airline.exception.InsufficientSeatsException;
import com.vayro.airline.exception.InvalidBookingStateException;
import com.vayro.airline.exception.ResourceNotFoundException;
import com.vayro.airline.mapper.BookingMapper;
import com.vayro.airline.repository.BookingRepository;
import com.vayro.airline.repository.FlightRepository;
import com.vayro.airline.repository.UserRepository;
import com.vayro.airline.service.BookingService;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class BookingServiceImpl implements BookingService {

    private final BookingRepository bookingRepository;
    private final FlightRepository flightRepository;
    private final UserRepository userRepository;
    private final BookingMapper bookingMapper;

    public BookingServiceImpl(BookingRepository bookingRepository,
                              FlightRepository flightRepository,
                              UserRepository userRepository,
                              BookingMapper bookingMapper) {
        this.bookingRepository = bookingRepository;
        this.flightRepository = flightRepository;
        this.userRepository = userRepository;
        this.bookingMapper = bookingMapper;
    }

    @Override
    @Transactional
    public BookingResponse createBooking(BookingRequest request, String userEmail) {
        if (request.getNumberOfPassengers() == null || request.getNumberOfPassengers() <= 0) {
            throw new BadRequestException("Number of passengers must be a positive integer.");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Flight flight = flightRepository.findById(request.getFlightId())
                .orElseThrow(() -> new ResourceNotFoundException("Flight not found with id: " + request.getFlightId()));

        if (!flight.getStatus().isBookable()) {
            throw new BadRequestException("Flight " + flight.getFlightNumber() + " is currently "
                    + flight.getStatus() + " and not open for new bookings.");
        }

        if (flight.getDepartureTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot book a flight that has already departed or has a past departure time.");
        }

        if (flight.getAvailableSeats() < request.getNumberOfPassengers()) {
            throw new InsufficientSeatsException("Requested " + request.getNumberOfPassengers()
                    + " seats, but only " + flight.getAvailableSeats() + " seats are available.");
        }

        // Server-side total price calculation using high-precision BigDecimal
        BigDecimal totalPrice = flight.getPrice().multiply(BigDecimal.valueOf(request.getNumberOfPassengers()));

        // Deduct available seats
        flight.setAvailableSeats(flight.getAvailableSeats() - request.getNumberOfPassengers());

        try {
            // Save flight with optimistic locking (@Version check triggers on flush)
            flightRepository.save(flight);
        } catch (OptimisticLockingFailureException ex) {
            throw new BookingConflictException("Seat availability was updated by a concurrent transaction. Please retry.");
        }

        String bookingRef = generateUniqueBookingReference();
        Booking booking = new Booking(
                bookingRef,
                user,
                flight,
                request.getNumberOfPassengers(),
                totalPrice,
                BookingStatus.CONFIRMED
        );

        Booking savedBooking = bookingRepository.save(booking);
        return bookingMapper.toResponse(savedBooking);
    }

    @Override
    @Transactional(readOnly = true)
    public BookingResponse getBookingByReference(String bookingReference, String userEmail, boolean isAdmin) {
        Booking booking = bookingRepository.findByBookingReference(bookingReference.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with reference: " + bookingReference));

        if (!isAdmin && !booking.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("You are not authorized to view this booking.");
        }

        return bookingMapper.toResponse(booking);
    }

    @Override
    @Transactional
    public BookingResponse cancelBooking(String bookingReference, String userEmail, boolean isAdmin) {
        Booking booking = bookingRepository.findByBookingReference(bookingReference.trim().toUpperCase())
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with reference: " + bookingReference));

        if (!isAdmin && !booking.getUser().getEmail().equalsIgnoreCase(userEmail)) {
            throw new AccessDeniedException("You are not authorized to cancel this booking.");
        }

        if (booking.getBookingStatus() == BookingStatus.CANCELLED) {
            throw new InvalidBookingStateException("Booking '" + bookingReference + "' is already cancelled.");
        }

        Flight flight = booking.getFlight();

        // Restore seat capacity
        flight.setAvailableSeats(flight.getAvailableSeats() + booking.getNumberOfPassengers());
        flightRepository.save(flight);

        booking.setBookingStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        return bookingMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> getUserBookings(String userEmail, int page, int size, String sortBy, String sortDir) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with email: " + userEmail));

        Sort sort = Sort.by(Sort.Direction.fromString(sortDir.equalsIgnoreCase("asc") ? "ASC" : "DESC"),
                sanitizeBookingSortBy(sortBy));
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), sort);

        Page<Booking> bookingPage = bookingRepository.findByUser_Id(user.getId(), pageable);
        List<BookingResponse> responses = bookingPage.getContent().stream()
                .map(bookingMapper::toResponse)
                .toList();

        return PageResponse.of(bookingPage, responses);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<BookingResponse> getAllBookings(int page, int size, String sortBy, String sortDir) {
        Sort sort = Sort.by(Sort.Direction.fromString(sortDir.equalsIgnoreCase("asc") ? "ASC" : "DESC"),
                sanitizeBookingSortBy(sortBy));
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.max(1, size), sort);

        Page<Booking> bookingPage = bookingRepository.findAllWithDetails(pageable);
        List<BookingResponse> responses = bookingPage.getContent().stream()
                .map(bookingMapper::toResponse)
                .toList();

        return PageResponse.of(bookingPage, responses);
    }

    private String generateUniqueBookingReference() {
        String ref;
        do {
            ref = "VAYRO-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
        } while (bookingRepository.existsByBookingReference(ref));
        return ref;
    }

    private String sanitizeBookingSortBy(String sortBy) {
        if (sortBy == null || sortBy.trim().isEmpty()) {
            return "bookedAt";
        }
        return switch (sortBy.toLowerCase()) {
            case "totalprice" -> "totalPrice";
            case "numberofpassengers" -> "numberOfPassengers";
            case "bookingstatus" -> "bookingStatus";
            default -> "bookedAt";
        };
    }
}
