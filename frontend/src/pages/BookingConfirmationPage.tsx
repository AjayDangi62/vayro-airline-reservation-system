import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, Plane, Calendar, MapPin, Users, Printer, ArrowRight, ShieldCheck } from 'lucide-react';
import { bookingApi } from '../api/bookings';
import { BookingResponse } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getErrorMessage } from '../api/client';

export const BookingConfirmationPage: React.FC = () => {
  const { reference } = useParams<{ reference: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [booking, setBooking] = useState<BookingResponse | null>(() => {
    return (location.state as { booking?: BookingResponse })?.booking || null;
  });
  const [isLoading, setIsLoading] = useState(!booking);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!booking && reference) {
      const fetchBooking = async () => {
        try {
          const data = await bookingApi.getBookingByReference(reference);
          setBooking(data);
        } catch (err) {
          setErrorMessage(getErrorMessage(err));
        } finally {
          setIsLoading(false);
        }
      };
      fetchBooking();
    }
  }, [booking, reference]);

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner message="Fetching verified reservation record..." />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl text-center">
        <h2 className="text-xl font-bold text-slate-800">Booking Record Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">{errorMessage || 'Unable to retrieve reservation details.'}</p>
        <Link
          to="/my-bookings"
          className="mt-6 inline-block px-5 py-2.5 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-500"
        >
          Check My Bookings
        </Link>
      </div>
    );
  }

  const depDate = new Date(booking.departureTime);
  const arrDate = new Date(booking.arrivalTime);
  const bookedDate = new Date(booking.bookedAt);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Success Badge */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4 ring-8 ring-emerald-50">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
          Reservation Confirmed
        </span>
        <h1 className="text-3xl font-black text-slate-900 mt-1">
          Have a Wonderful Flight!
        </h1>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Your booking has been registered with Vayro Flight Systems. Your seats are guaranteed.
        </p>
      </div>

      {/* Boarding Pass / Ticket Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden mb-8">
        {/* Ticket Header */}
        <div className="bg-slate-900 text-white px-8 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 flex items-center justify-center text-white">
              <Plane className="w-5 h-5 transform -rotate-45" />
            </div>
            <div>
              <p className="text-xs text-sky-400 font-semibold tracking-wider uppercase">Official E-Ticket</p>
              <h3 className="text-lg font-bold">{booking.airlineName}</h3>
            </div>
          </div>

          <div className="sm:text-right">
            <span className="text-xs text-slate-400 block uppercase font-medium">Booking Reference</span>
            <span className="text-xl sm:text-2xl font-mono font-black text-sky-400 tracking-wider">
              {booking.bookingReference}
            </span>
          </div>
        </div>

        {/* Flight Details Body */}
        <div className="p-8 space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center text-center sm:text-left">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Departure</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{booking.source}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">
                {depDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-sm font-bold text-sky-600">
                {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs font-mono font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full mb-2">
                {booking.flightNumber}
              </span>
              <div className="w-full flex items-center justify-center space-x-2 text-slate-300">
                <span className="w-12 h-[2px] bg-slate-200"></span>
                <Plane className="w-4 h-4 text-sky-600 transform rotate-90" />
                <span className="w-12 h-[2px] bg-slate-200"></span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 mt-2 uppercase tracking-wide">
                Status: {booking.bookingStatus}
              </span>
            </div>

            <div className="sm:text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Arrival</span>
              <p className="text-3xl font-black text-slate-900 mt-1">{booking.destination}</p>
              <p className="text-xs font-semibold text-slate-600 mt-1">
                {arrDate.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p className="text-sm font-bold text-sky-600">
                {arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="border-t border-b border-dashed border-slate-200 py-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase block">Passengers</span>
              <span className="text-base font-bold text-slate-800">
                {booking.numberOfPassengers} {booking.numberOfPassengers === 1 ? 'Traveler' : 'Travelers'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase block">Total Amount</span>
              <span className="text-base font-bold text-sky-600">${booking.totalPrice.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase block">Booked On</span>
              <span className="text-xs font-semibold text-slate-700">
                {bookedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-semibold uppercase block">Seat Inventory</span>
              <span className="text-xs font-bold text-emerald-600 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Reserved</span>
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
            <p className="text-xs text-slate-400">
              Present this reference code or digital confirmation upon airport check-in.
            </p>
            <button
              onClick={() => window.print()}
              className="inline-flex items-center space-x-2 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold"
            >
              <Printer className="w-4 h-4" />
              <span>Print E-Ticket</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={() => navigate('/my-bookings')}
          className="w-full sm:w-auto px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition-all shadow-md"
        >
          View In My Bookings
        </button>

        <button
          onClick={() => navigate('/flights')}
          className="w-full sm:w-auto px-6 py-3 border border-slate-300 hover:bg-slate-50 text-slate-800 font-bold rounded-xl text-sm transition-all"
        >
          Book Another Flight
        </button>
      </div>
    </div>
  );
};
