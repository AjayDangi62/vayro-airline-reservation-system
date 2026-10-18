package com.vayro.airline.service;

import com.vayro.airline.dto.BookingRequest;
import com.vayro.airline.dto.BookingResponse;
import com.vayro.airline.dto.PageResponse;

public interface BookingService {

    BookingResponse createBooking(BookingRequest request, String userEmail);

    BookingResponse getBookingByReference(String bookingReference, String userEmail, boolean isAdmin);

    BookingResponse cancelBooking(String bookingReference, String userEmail, boolean isAdmin);

    PageResponse<BookingResponse> getUserBookings(String userEmail, int page, int size, String sortBy, String sortDir);

    PageResponse<BookingResponse> getAllBookings(int page, int size, String sortBy, String sortDir);
}
