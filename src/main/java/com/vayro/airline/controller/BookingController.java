package com.vayro.airline.controller;

import com.vayro.airline.dto.BookingRequest;
import com.vayro.airline.dto.BookingResponse;
import com.vayro.airline.dto.PageResponse;
import com.vayro.airline.security.UserPrincipal;
import com.vayro.airline.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import static com.vayro.airline.config.OpenApiConfig.BEARER_AUTH;

@RestController
@RequestMapping("/api/v1/bookings")
@Tag(name = "Bookings", description = "Endpoints for creating, reviewing, and cancelling flight reservations")
@SecurityRequirement(name = BEARER_AUTH)
public class BookingController {

    private final BookingService bookingService;

    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @PostMapping
    @Operation(summary = "Create a flight booking", description = "Reserves passenger seats for an open scheduled flight. Decrements seat count atomically.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Booking confirmed successfully"),
            @ApiResponse(responseCode = "400", description = "Insufficient seats or invalid booking request"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "409", description = "Concurrency collision on seat inventory. Retry advised.")
    })
    public ResponseEntity<BookingResponse> createBooking(
            @Valid @RequestBody BookingRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        BookingResponse response = bookingService.createBooking(request, currentUser.getUsername());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @GetMapping("/my")
    @Operation(summary = "Get current user's bookings", description = "Retrieves all flight reservations made by the authenticated customer.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Bookings retrieved successfully"),
            @ApiResponse(responseCode = "401", description = "Unauthorized")
    })
    public ResponseEntity<PageResponse<BookingResponse>> getMyBookings(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Parameter(description = "Page index (zero-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sort property (bookedAt, totalPrice, numberOfPassengers)") @RequestParam(defaultValue = "bookedAt") String sortBy,
            @Parameter(description = "Sort direction (asc, desc)") @RequestParam(defaultValue = "desc") String sortDir) {
        PageResponse<BookingResponse> response = bookingService.getUserBookings(
                currentUser.getUsername(), page, size, sortBy, sortDir
        );
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{bookingReference}")
    @Operation(summary = "Get booking by reference code", description = "Fetch reservation details using its unique reference (e.g. VAYRO-A1B2C3D4).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Booking found"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - cannot access another user's reservation"),
            @ApiResponse(responseCode = "404", description = "Booking not found")
    })
    public ResponseEntity<BookingResponse> getBookingByReference(
            @PathVariable String bookingReference,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        BookingResponse response = bookingService.getBookingByReference(
                bookingReference, currentUser.getUsername(), isAdmin
        );
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{bookingReference}/cancel")
    @Operation(summary = "Cancel a reservation", description = "Cancels a confirmed booking and immediately releases the reserved seats back into inventory.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Booking cancelled successfully and seats restored"),
            @ApiResponse(responseCode = "400", description = "Booking is already cancelled"),
            @ApiResponse(responseCode = "401", description = "Unauthorized"),
            @ApiResponse(responseCode = "403", description = "Forbidden - cannot cancel another user's reservation"),
            @ApiResponse(responseCode = "404", description = "Booking not found")
    })
    public ResponseEntity<BookingResponse> cancelBooking(
            @PathVariable String bookingReference,
            @AuthenticationPrincipal UserPrincipal currentUser) {
        boolean isAdmin = currentUser.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        BookingResponse response = bookingService.cancelBooking(
                bookingReference, currentUser.getUsername(), isAdmin
        );
        return ResponseEntity.ok(response);
    }
}
