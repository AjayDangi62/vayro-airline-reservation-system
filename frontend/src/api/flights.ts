import { apiClient } from './client';
import { Flight, PageResponse } from '../types';

export interface FlightSearchParams {
  source: string;
  destination: string;
  travelDate: string; // YYYY-MM-DD
  minSeats?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
}

export const flightApi = {
  getAllFlights: async (
    page = 0,
    size = 10,
    sortBy = 'departureTime',
    sortDir: 'asc' | 'desc' = 'asc'
  ): Promise<PageResponse<Flight>> => {
    const response = await apiClient.get<PageResponse<Flight>>('/flights', {
      params: { page, size, sortBy, sortDir },
    });
    return response.data;
  },

  getFlightById: async (id: number): Promise<Flight> => {
    const response = await apiClient.get<Flight>(`/flights/${id}`);
    return response.data;
  },

  searchFlights: async (params: FlightSearchParams): Promise<PageResponse<Flight>> => {
    const response = await apiClient.get<PageResponse<Flight>>('/flights/search', {
      params: {
        source: params.source,
        destination: params.destination,
        travelDate: params.travelDate,
        minSeats: params.minSeats ?? 1,
        page: params.page ?? 0,
        size: params.size ?? 10,
        sortBy: params.sortBy ?? 'departureTime',
        sortDir: params.sortDir ?? 'asc',
      },
    });
    return response.data;
  },
};
