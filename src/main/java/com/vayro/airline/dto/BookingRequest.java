package com.vayro.airline.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class BookingRequest {

    @NotNull(message = "Flight ID is required")
    private Long flightId;

    @NotNull(message = "Number of passengers is required")
    @Min(value = 1, message = "At least 1 passenger is required for a booking")
    @Max(value = 10, message = "Cannot book more than 10 seats in a single reservation")
    private Integer numberOfPassengers;

    public BookingRequest() {
    }

    public BookingRequest(Long flightId, Integer numberOfPassengers) {
        this.flightId = flightId;
        this.numberOfPassengers = numberOfPassengers;
    }

    public Long getFlightId() {
        return flightId;
    }

    public void setFlightId(Long flightId) {
        this.flightId = flightId;
    }

    public Integer getNumberOfPassengers() {
        return numberOfPassengers;
    }

    public void setNumberOfPassengers(Integer numberOfPassengers) {
        this.numberOfPassengers = numberOfPassengers;
    }
}
