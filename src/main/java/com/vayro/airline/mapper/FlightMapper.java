package com.vayro.airline.mapper;

import com.vayro.airline.dto.FlightRequest;
import com.vayro.airline.dto.FlightResponse;
import com.vayro.airline.entity.Flight;
import com.vayro.airline.enums.FlightStatus;
import org.springframework.stereotype.Component;

@Component
public class FlightMapper {

    public Flight toEntity(FlightRequest request) {
        if (request == null) {
            return null;
        }
        return new Flight(
                request.getFlightNumber().trim().toUpperCase(),
                request.getAirlineName().trim(),
                request.getSource().trim().toUpperCase(),
                request.getDestination().trim().toUpperCase(),
                request.getDepartureTime(),
                request.getArrivalTime(),
                request.getTotalSeats(),
                request.getTotalSeats(), // initially available = total
                request.getPrice(),
                FlightStatus.SCHEDULED
        );
    }

    public FlightResponse toResponse(Flight flight) {
        if (flight == null) {
            return null;
        }
        return new FlightResponse(
                flight.getId(),
                flight.getFlightNumber(),
                flight.getAirlineName(),
                flight.getSource(),
                flight.getDestination(),
                flight.getDepartureTime(),
                flight.getArrivalTime(),
                flight.getTotalSeats(),
                flight.getAvailableSeats(),
                flight.getPrice(),
                flight.getStatus(),
                flight.getCreatedAt()
        );
    }
}
