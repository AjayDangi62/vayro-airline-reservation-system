package com.vayro.airline.controller;

import com.vayro.airline.dto.BookingResponse;
import com.vayro.airline.dto.PageResponse;
import com.vayro.airline.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import static com.vayro.airline.config.OpenApiConfig.BEARER_AUTH;

@RestController
@RequestMapping("/api/v1/admin/bookings")
@Tag(name = "Admin - Booking Operations", description = "Administrative endpoints for monitoring and managing all customer reservations")
@SecurityRequirement(name = BEARER_AUTH)
@PreAuthorize("hasRole('ADMIN')")
public class AdminBookingController {

    private final BookingService bookingService;

    public AdminBookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }

    @GetMapping
    @Operation(summary = "List all platform bookings", description = "Retrieves all bookings made by all users. Strictly restricted to administrators.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Bookings retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ROLE_ADMIN")
    })
    public ResponseEntity<PageResponse<BookingResponse>> getAllBookings(
            @Parameter(description = "Page index (zero-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sort property (bookedAt, totalPrice, numberOfPassengers)") @RequestParam(defaultValue = "bookedAt") String sortBy,
            @Parameter(description = "Sort direction (asc, desc)") @RequestParam(defaultValue = "desc") String sortDir) {
        PageResponse<BookingResponse> response = bookingService.getAllBookings(page, size, sortBy, sortDir);
        return ResponseEntity.ok(response);
    }
}
