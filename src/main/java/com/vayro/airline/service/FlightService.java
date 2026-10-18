package com.vayro.airline.service;

import com.vayro.airline.dto.FlightRequest;
import com.vayro.airline.dto.FlightResponse;
import com.vayro.airline.dto.PageResponse;
import com.vayro.airline.enums.FlightStatus;

import java.time.LocalDate;

public interface FlightService {

    FlightResponse createFlight(FlightRequest request);

    FlightResponse updateFlight(Long id, FlightRequest request);

    FlightResponse updateFlightStatus(Long id, FlightStatus status);

    FlightResponse getFlightById(Long id);

    PageResponse<FlightResponse> searchFlights(String source, String destination, LocalDate travelDate,
                                              int minSeats, int page, int size, String sortBy, String sortDir);

    PageResponse<FlightResponse> getAllFlights(int page, int size, String sortBy, String sortDir);
}
