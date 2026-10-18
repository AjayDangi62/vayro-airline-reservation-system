export type Role = 'ROLE_USER' | 'ROLE_ADMIN';

export type FlightStatus = 'SCHEDULED' | 'ACTIVE' | 'DELAYED' | 'CANCELLED' | 'COMPLETED';

export type BookingStatus = 'CONFIRMED' | 'CANCELLED';

export interface User {
  id: number;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Flight {
  id: number;
  flightNumber: string;
  airlineName: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  totalSeats: number;
  availableSeats: number;
  price: number;
  status: FlightStatus;
  createdAt?: string;
}

export interface FlightRequest {
  flightNumber: string;
  airlineName: string;
  source: string;
  destination: string;
  departureTime: string; // ISO format: yyyy-MM-ddTHH:mm:ss
  arrivalTime: string;   // ISO format: yyyy-MM-ddTHH:mm:ss
  totalSeats: number;
  price: number;
}

export interface FlightStatusUpdateRequest {
  status: FlightStatus;
}

export interface BookingRequest {
  flightId: number;
  numberOfPassengers: number;
}

export interface BookingResponse {
  id: number;
  bookingReference: string;
  flightId: number;
  flightNumber: string;
  airlineName: string;
  source: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  numberOfPassengers: number;
  totalPrice: number;
  bookingStatus: BookingStatus;
  bookedAt: string;
  userId?: number;
  userEmail?: string;
  userFullName?: string;
}

export interface PageResponse<T> {
  content: T[];
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  isLast: boolean;
}

export interface ApiErrorResponse {
  timestamp?: string;
  status?: number;
  error?: string;
  message?: string;
  errors?: Record<string, string>;
}
