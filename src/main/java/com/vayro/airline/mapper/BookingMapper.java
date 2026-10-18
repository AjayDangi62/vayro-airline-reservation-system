package com.vayro.airline.mapper;

import com.vayro.airline.dto.BookingResponse;
import com.vayro.airline.entity.Booking;
import org.springframework.stereotype.Component;

@Component
public class BookingMapper {

    public BookingResponse toResponse(Booking booking) {
        if (booking == null) {
            return null;
        }

        BookingResponse response = new BookingResponse();
        response.setId(booking.getId());
        response.setBookingReference(booking.getBookingReference());
        response.setNumberOfPassengers(booking.getNumberOfPassengers());
        response.setTotalPrice(booking.getTotalPrice());
        response.setBookingStatus(booking.getBookingStatus());
        response.setBookedAt(booking.getBookedAt());

        if (booking.getFlight() != null) {
            response.setFlightId(booking.getFlight().getId());
            response.setFlightNumber(booking.getFlight().getFlightNumber());
            response.setAirlineName(booking.getFlight().getAirlineName());
            response.setSource(booking.getFlight().getSource());
            response.setDestination(booking.getFlight().getDestination());
            response.setDepartureTime(booking.getFlight().getDepartureTime());
            response.setArrivalTime(booking.getFlight().getArrivalTime());
        }

        if (booking.getUser() != null) {
            response.setUserId(booking.getUser().getId());
            response.setUserEmail(booking.getUser().getEmail());
            response.setUserFullName(booking.getUser().getFullName());
        }

        return response;
    }
}
