package com.vayro.airline.controller;

import com.vayro.airline.dto.FlightResponse;
import com.vayro.airline.dto.PageResponse;
import com.vayro.airline.service.FlightService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v1/flights")
@Tag(name = "Flights", description = "Public endpoints for browsing and searching available flights")
public class FlightController {

    private final FlightService flightService;

    public FlightController(FlightService flightService) {
        this.flightService = flightService;
    }

    @GetMapping
    @SecurityRequirements
    @Operation(summary = "List all flights", description = "Retrieve a paginated and sorted list of all scheduled flights.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Flights retrieved successfully")
    })
    public ResponseEntity<PageResponse<FlightResponse>> getAllFlights(
            @Parameter(description = "Page index (zero-based)") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size") @RequestParam(defaultValue = "10") int size,
            @Parameter(description = "Sort property (departureTime, price, availableSeats, flightNumber)") @RequestParam(defaultValue = "departureTime") String sortBy,
            @Parameter(description = "Sort direction (asc, desc)") @RequestParam(defaultValue = "asc") String sortDir) {
        PageResponse<FlightResponse> response = flightService.getAllFlights(page, size, sortBy, sortDir);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @SecurityRequirements
    @Operation(summary = "Get flight by ID", description = "Retrieve comprehensive details for a specific flight.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Flight details found"),
            @ApiResponse(responseCode = "404", description = "Flight not found")
    })
    public ResponseEntity<FlightResponse> getFlightById(@PathVariable Long id) {
        FlightResponse response = flightService.getFlightById(id);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/search")
    @SecurityRequirements
    @Operation(summary = "Search flights by route and date", description = "Query available flights by source, destination, travel date, and minimum required seats.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Search query completed successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid search criteria (e.g. source equals destination)")
    })
    public ResponseEntity<PageResponse<FlightResponse>> searchFlights(
            @Parameter(description = "Source city or airport code (e.g. JFK or New York)", required = true)
            @RequestParam String source,

            @Parameter(description = "Destination city or airport code (e.g. LHR or London)", required = true)
            @RequestParam String destination,

            @Parameter(description = "Date of travel (format: YYYY-MM-DD)", required = true)
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate travelDate,

            @Parameter(description = "Minimum available seats needed")
            @RequestParam(defaultValue = "1") int minSeats,

            @Parameter(description = "Page index (zero-based)")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int size,

            @Parameter(description = "Sort property")
            @RequestParam(defaultValue = "departureTime") String sortBy,

            @Parameter(description = "Sort direction")
            @RequestParam(defaultValue = "asc") String sortDir) {

        PageResponse<FlightResponse> response = flightService.searchFlights(
                source, destination, travelDate, minSeats, page, size, sortBy, sortDir
        );
        return ResponseEntity.ok(response);
    }
}
