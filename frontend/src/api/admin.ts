import { apiClient } from './client';
import { BookingResponse, Flight, FlightRequest, FlightStatus, PageResponse } from '../types';

export const adminApi = {
  createFlight: async (request: FlightRequest): Promise<Flight> => {
    const response = await apiClient.post<Flight>('/admin/flights', request);
    return response.data;
  },

  updateFlight: async (id: number, request: FlightRequest): Promise<Flight> => {
    const response = await apiClient.put<Flight>(`/admin/flights/${id}`, request);
    return response.data;
  },

  updateFlightStatus: async (id: number, status: FlightStatus): Promise<Flight> => {
    const response = await apiClient.patch<Flight>(`/admin/flights/${id}/status`, { status });
    return response.data;
  },

  getAllBookings: async (
    page = 0,
    size = 10,
    sortBy = 'bookedAt',
    sortDir: 'asc' | 'desc' = 'desc'
  ): Promise<PageResponse<BookingResponse>> => {
    const response = await apiClient.get<PageResponse<BookingResponse>>('/admin/bookings', {
      params: { page, size, sortBy, sortDir },
    });
    return response.data;
  },
};
