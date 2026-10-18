import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plane, Calendar, Clock, AlertCircle, CheckCircle2, XCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { bookingApi } from '../api/bookings';
import { BookingResponse, PageResponse } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getErrorMessage } from '../api/client';

export const MyBookingsPage: React.FC = () => {
  const [bookingsPage, setBookingsPage] = useState<PageResponse<BookingResponse>>({
    content: [],
    pageNumber: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
    isLast: true,
  });
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cancellation modal state
  const [cancelTarget, setCancelTarget] = useState<BookingResponse | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await bookingApi.getMyBookings(page, 10, 'bookedAt', 'desc');
      setBookingsPage(data);
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setIsCancelling(true);
    setCancelError(null);
    try {
      const updated = await bookingApi.cancelBooking(cancelTarget.bookingReference);
      // Update booking in local state
      setBookingsPage((prev) => ({
        ...prev,
        content: prev.content.map((b) =>
          b.bookingReference === updated.bookingReference ? updated : b
        ),
      }));
      setCancelTarget(null);
    } catch (err) {
      setCancelError(getErrorMessage(err));
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-sky-600">
            Traveler Dashboard
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            My Flight Reservations
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            View booking status, access e-tickets, and manage active reservations.
          </p>
        </div>
        <Link
          to="/flights"
          className="inline-flex items-center space-x-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-600/20 transition-all"
        >
          <span>Book New Flight</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold">Failed to load reservations</h4>
            <p className="text-xs mt-0.5 text-red-700">{errorMessage}</p>
          </div>
          <button onClick={fetchBookings} className="text-xs font-bold underline hover:text-red-900">
            Retry
          </button>
        </div>
      )}

      {/* Content Area */}
      {isLoading ? (
        <LoadingSpinner message="Retrieving your reservation history..." />
      ) : bookingsPage.content.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Plane className="w-8 h-8 transform -rotate-45" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Reservations Yet</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            You haven't made any flight bookings yet. Search our available flights and plan your next journey with Vayro.
          </p>
          <Link
            to="/flights"
            className="inline-block px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800 shadow-sm"
          >
            Find Flights
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
            <span>Total Reservations: {bookingsPage.totalElements}</span>
            <span>Page {bookingsPage.pageNumber + 1} of {bookingsPage.totalPages || 1}</span>
          </div>

          <div className="space-y-4">
            {bookingsPage.content.map((booking) => {
              const depDate = new Date(booking.departureTime);
              const arrDate = new Date(booking.arrivalTime);
              const bookedDate = new Date(booking.bookedAt);
              const isConfirmed = booking.bookingStatus === 'CONFIRMED';

              return (
                <div
                  key={booking.id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col lg:flex-row items-center justify-between gap-6"
                >
                  {/* Left Column: Reference, Airline, Status */}
                  <div className="w-full lg:w-56 space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-mono font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md border border-sky-100">
                        {booking.bookingReference}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">{booking.airlineName}</h3>
                      <p className="text-xs font-semibold text-slate-500">Flight {booking.flightNumber}</p>
                    </div>
                    <div>
                      <span
                        className={`inline-flex items-center space-x-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          isConfirmed
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {isConfirmed ? (
                          <CheckCircle2 className="w-3 h-3" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        <span>{booking.bookingStatus}</span>
                      </span>
                    </div>
                  </div>

                  {/* Center Column: Route & Timing */}
                  <div className="flex-1 w-full flex items-center justify-between max-w-lg">
                    <div>
                      <p className="text-2xl font-black text-slate-900">{booking.source}</p>
                      <p className="text-xs text-slate-500 font-medium">
                        {depDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs font-bold text-sky-600">
                        {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>

                    <div className="flex flex-col items-center px-4">
                      <Plane className="w-4 h-4 text-slate-400 transform rotate-90" />
                      <span className="text-[10px] uppercase font-bold text-slate-400 mt-1">Direct</span>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-black text-slate-900">{booking.destination}</p>
                      <p className="text-xs text-slate-500 font-medium">
                        {arrDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-xs font-bold text-sky-600">
                        {arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  {/* Right Column: Passengers, Price & Actions */}
                  <div className="w-full lg:w-56 flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 space-y-2">
                    <div className="text-left lg:text-right">
                      <p className="text-lg font-black text-slate-900">${booking.totalPrice.toFixed(2)}</p>
                      <p className="text-xs text-slate-500">
                        {booking.numberOfPassengers} passenger{booking.numberOfPassengers > 1 ? 's' : ''}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Booked {bookedDate.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Link
                        to={`/confirmation/${booking.bookingReference}`}
                        state={{ booking }}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        Boarding Pass
                      </Link>

                      {isConfirmed && (
                        <button
                          onClick={() => setCancelTarget(booking)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {bookingsPage.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-6">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-600 px-3">
                {page + 1} of {bookingsPage.totalPages}
              </span>
              <button
                disabled={bookingsPage.isLast}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-lg font-bold text-slate-900">Cancel Flight Reservation?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Reference: <span className="font-mono font-bold text-slate-700">{cancelTarget.bookingReference}</span>
              </p>
              <p className="text-sm text-slate-600 mt-3 leading-relaxed">
                Cancelling this reservation will release <span className="font-bold text-slate-900">{cancelTarget.numberOfPassengers} reserved seat(s)</span> back to available inventory. This action cannot be reversed.
              </p>
            </div>

            {cancelError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium">
                {cancelError}
              </div>
            )}

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                disabled={isCancelling}
                onClick={() => {
                  setCancelTarget(null);
                  setCancelError(null);
                }}
                className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-sm font-bold transition-colors"
              >
                Keep Reservation
              </button>
              <button
                type="button"
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-sm font-bold transition-colors shadow-md shadow-rose-600/20 disabled:opacity-50"
              >
                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
