import { apiClient } from './client';
import { BookingRequest, BookingResponse, PageResponse } from '../types';

export const bookingApi = {
  createBooking: async (request: BookingRequest): Promise<BookingResponse> => {
    const response = await apiClient.post<BookingResponse>('/bookings', request);
    return response.data;
  },

  getMyBookings: async (
    page = 0,
    size = 10,
    sortBy = 'bookedAt',
    sortDir: 'asc' | 'desc' = 'desc'
  ): Promise<PageResponse<BookingResponse>> => {
    const response = await apiClient.get<PageResponse<BookingResponse>>('/bookings/my', {
      params: { page, size, sortBy, sortDir },
    });
    return response.data;
  },

  getBookingByReference: async (bookingReference: string): Promise<BookingResponse> => {
    const response = await apiClient.get<BookingResponse>(`/bookings/${bookingReference}`);
    return response.data;
  },

  cancelBooking: async (bookingReference: string): Promise<BookingResponse> => {
    const response = await apiClient.patch<BookingResponse>(`/bookings/${bookingReference}/cancel`);
    return response.data;
  },
};
