package com.vayro.airline.controller;

import com.vayro.airline.dto.FlightRequest;
import com.vayro.airline.dto.FlightResponse;
import com.vayro.airline.dto.FlightStatusUpdateRequest;
import com.vayro.airline.service.FlightService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import static com.vayro.airline.config.OpenApiConfig.BEARER_AUTH;

@RestController
@RequestMapping("/api/v1/admin/flights")
@Tag(name = "Admin - Flight Operations", description = "Administrative endpoints for scheduling and managing flights")
@SecurityRequirement(name = BEARER_AUTH)
@PreAuthorize("hasRole('ADMIN')")
public class AdminFlightController {

    private final FlightService flightService;

    public AdminFlightController(FlightService flightService) {
        this.flightService = flightService;
    }

    @PostMapping
    @Operation(summary = "Create a new flight schedule", description = "Allows administrators to publish a new flight.")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Flight created successfully"),
            @ApiResponse(responseCode = "400", description = "Validation error or invalid flight timing"),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ROLE_ADMIN"),
            @ApiResponse(responseCode = "409", description = "Flight number already exists")
    })
    public ResponseEntity<FlightResponse> createFlight(@Valid @RequestBody FlightRequest request) {
        FlightResponse response = flightService.createFlight(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update flight details", description = "Update schedule, route, price, or capacity of an existing flight.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Flight updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid request or capacity conflict"),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ROLE_ADMIN"),
            @ApiResponse(responseCode = "404", description = "Flight not found")
    })
    public ResponseEntity<FlightResponse> updateFlight(@PathVariable Long id, @Valid @RequestBody FlightRequest request) {
        FlightResponse response = flightService.updateFlight(id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update flight status", description = "Change flight operational status (e.g. CANCELLED, DELAYED, ACTIVE).")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Flight status updated successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid status"),
            @ApiResponse(responseCode = "403", description = "Forbidden - requires ROLE_ADMIN"),
            @ApiResponse(responseCode = "404", description = "Flight not found")
    })
    public ResponseEntity<FlightResponse> updateFlightStatus(
            @PathVariable Long id,
            @Valid @RequestBody FlightStatusUpdateRequest request) {
        FlightResponse response = flightService.updateFlightStatus(id, request.getStatus());
        return ResponseEntity.ok(response);
    }
}
