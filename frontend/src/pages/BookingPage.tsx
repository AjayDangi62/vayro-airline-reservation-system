import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Plane, Calendar, MapPin, Users, ShieldAlert, CheckCircle, CreditCard, ArrowRight, Info } from 'lucide-react';
import { flightApi } from '../api/flights';
import { bookingApi } from '../api/bookings';
import { Flight } from '../types';
import { useAuth } from '../context/AuthContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getErrorMessage } from '../api/client';

export const BookingPage: React.FC = () => {
  const { flightId } = useParams<{ flightId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [flight, setFlight] = useState<Flight | null>(null);
  const [passengersCount, setPassengersCount] = useState<number>(() => {
    const p = Number(searchParams.get('passengers'));
    return p >= 1 && p <= 10 ? p : 1;
  });

  // Local passenger detail forms for user UX
  const [passengerNames, setPassengerNames] = useState<string[]>(['']);
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phoneNumber || '');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync passenger names array when passenger count changes
  useEffect(() => {
    setPassengerNames((prev) => {
      const arr = [...prev];
      if (arr.length < passengersCount) {
        while (arr.length < passengersCount) {
          arr.push('');
        }
      } else if (arr.length > passengersCount) {
        arr.length = passengersCount;
      }
      return arr;
    });
  }, [passengersCount]);

  // Pre-fill primary passenger name if user is logged in
  useEffect(() => {
    if (user && passengerNames[0] === '') {
      setPassengerNames((prev) => {
        const arr = [...prev];
        arr[0] = user.fullName;
        return arr;
      });
      if (!contactEmail) setContactEmail(user.email);
      if (!contactPhone && user.phoneNumber) setContactPhone(user.phoneNumber);
    }
  }, [user, contactEmail, contactPhone, passengerNames]);

  useEffect(() => {
    if (!flightId) {
      navigate('/flights');
      return;
    }
    const fetchFlight = async () => {
      try {
        const data = await flightApi.getFlightById(Number(flightId));
        setFlight(data);
      } catch (err) {
        setErrorMessage(getErrorMessage(err));
      } finally {
        setIsLoading(false);
      }
    };
    fetchFlight();
  }, [flightId, navigate]);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/book/${flightId}?passengers=${passengersCount}` } });
      return;
    }

    if (!flight) return;

    if (passengersCount > flight.availableSeats) {
      setErrorMessage(`Only ${flight.availableSeats} seat(s) remaining for this flight.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Backend BookingRequest takes flightId and numberOfPassengers
      const booking = await bookingApi.createBooking({
        flightId: flight.id,
        numberOfPassengers: passengersCount,
      });

      // Navigate to confirmation page passing booking data
      navigate(`/confirmation/${booking.bookingReference}`, { state: { booking } });
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <LoadingSpinner message="Retrieving flight details..." />
      </div>
    );
  }

  if (!flight) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl text-center">
        <h2 className="text-xl font-bold text-slate-800">Flight Not Found</h2>
        <p className="text-sm text-slate-500 mt-2">The flight ID provided does not exist or has been removed.</p>
        <button
          onClick={() => navigate('/flights')}
          className="mt-6 px-4 py-2 bg-sky-600 text-white rounded-xl text-sm font-semibold hover:bg-sky-500"
        >
          Back to Flight Search
        </button>
      </div>
    );
  }

  const basePrice = flight.price;
  const totalPrice = basePrice * passengersCount;
  const depTime = new Date(flight.departureTime);
  const arrTime = new Date(flight.arrivalTime);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <span className="text-xs font-bold uppercase tracking-widest text-sky-600">
          Flight Reservation Checkout
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
          Complete Your Vayro Reservation
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your itinerary, specify passenger details, and confirm seat allocations.
        </p>
      </div>

      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-800">
          <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold">Booking Request Failed</h4>
            <p className="text-xs mt-0.5 text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Passenger and Itinerary Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Flight Summary Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md uppercase">
                  {flight.flightNumber}
                </span>
                <span className="text-sm font-bold text-slate-700">{flight.airlineName}</span>
              </div>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                {flight.availableSeats} seats left
              </span>
            </div>

            <div className="grid grid-cols-3 items-center py-2 text-center sm:text-left">
              <div>
                <p className="text-xs text-slate-400 font-semibold uppercase">Origin</p>
                <p className="text-2xl font-black text-slate-900">{flight.source}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {depTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-xs font-bold text-sky-600">
                  {depTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>

              <div className="flex flex-col items-center">
                <Plane className="w-5 h-5 text-sky-500 transform rotate-90" />
                <span className="text-[11px] font-semibold text-slate-400 mt-1">Direct Flight</span>
              </div>

              <div className="sm:text-right">
                <p className="text-xs text-slate-400 font-semibold uppercase">Destination</p>
                <p className="text-2xl font-black text-slate-900">{flight.destination}</p>
                <p className="text-xs text-slate-600 mt-1">
                  {arrTime.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
                <p className="text-xs font-bold text-sky-600">
                  {arrTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          </div>

          {/* Passenger Information Form */}
          <form onSubmit={handleSubmitBooking} className="space-y-6">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <Users className="w-4 h-4 text-sky-600" />
                  <span>Passenger Information</span>
                </h3>

                <div className="flex items-center space-x-2">
                  <label className="text-xs font-semibold text-slate-500">Seats to Book:</label>
                  <select
                    value={passengersCount}
                    onChange={(e) => setPassengersCount(Number(e.target.value))}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold bg-white focus:ring-2 focus:ring-sky-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Passenger' : 'Passengers'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {passengerNames.map((name, idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-xs font-semibold text-slate-600">
                      Passenger {idx + 1} Full Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => {
                        const newNames = [...passengerNames];
                        newNames[idx] = e.target.value;
                        setPassengerNames(newNames);
                      }}
                      placeholder={`e.g. ${idx === 0 ? user?.fullName || 'Jane Doe' : 'John Doe'}`}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500 font-medium"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Confirmation Email</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600">Mobile Phone</label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 555-0199"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Payment & Processing Policy Notice */}
            <div className="bg-sky-50/70 border border-sky-100 rounded-2xl p-5 space-y-2 text-sky-950">
              <div className="flex items-center space-x-2">
                <Info className="w-4 h-4 text-sky-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-sky-800">
                  Payment Processing Status
                </h4>
              </div>
              <p className="text-xs leading-relaxed text-sky-800">
                Payment gateway processing is currently not integrated in this deployment. All reservations are directly guaranteed and verified without charging credit cards.
              </p>
            </div>

            {/* Submit Action */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-extrabold rounded-2xl shadow-xl shadow-sky-600/25 text-base flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Confirming Seats with Airline...</span>
              ) : (
                <>
                  <span>Confirm Reservation ({passengersCount} Seat{passengersCount > 1 ? 's' : ''})</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right 1 Col: Pricing Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
              Fare Breakdown
            </h3>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Base Fare (× {passengersCount})</span>
                <span className="font-semibold text-slate-800">${(basePrice * passengersCount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Airport Taxes & Security</span>
                <span className="font-semibold text-emerald-600">$0.00 (Waived)</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Carrier Surcharge</span>
                <span className="font-semibold text-emerald-600">$0.00</span>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-between items-baseline">
                <div>
                  <span className="text-base font-bold text-slate-900 block">Total Due</span>
                  <span className="text-xs text-slate-400">Guaranteed fixed rate</span>
                </div>
                <span className="text-2xl font-black text-sky-600">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Guarantee Badges */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-3">
            <div className="flex items-center space-x-2.5">
              <CheckCircle className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-semibold">Immediate Seat Allocation</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <CheckCircle className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-semibold">Instant E-Ticket Reference</span>
            </div>
            <div className="flex items-center space-x-2.5">
              <CheckCircle className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-semibold">Easy Cancellation via Dashboard</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
