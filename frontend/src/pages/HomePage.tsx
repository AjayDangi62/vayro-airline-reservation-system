import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plane, Calendar, MapPin, Users, ArrowRight, Shield, Zap, Sparkles, Clock } from 'lucide-react';
import { flightApi } from '../api/flights';
import { Flight } from '../types';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [travelDate, setTravelDate] = useState(() => {
    // Default to tomorrow's date
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [passengers, setPassengers] = useState(1);
  const [featuredFlights, setFeaturedFlights] = useState<Flight[]>([]);
  const [isLoadingFlights, setIsLoadingFlights] = useState(true);

  useEffect(() => {
    const fetchRecentFlights = async () => {
      try {
        const response = await flightApi.getAllFlights(0, 6, 'departureTime', 'asc');
        setFeaturedFlights(response.content || []);
      } catch (err) {
        console.error('Failed to load featured flights', err);
      } finally {
        setIsLoadingFlights(false);
      }
    };
    fetchRecentFlights();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source.trim() || !destination.trim() || !travelDate) {
      navigate('/flights');
      return;
    }
    navigate(`/flights?source=${encodeURIComponent(source.trim())}&destination=${encodeURIComponent(destination.trim())}&travelDate=${travelDate}&minSeats=${passengers}`);
  };

  const popularRoutes = [
    { from: 'JFK', to: 'LHR', cityFrom: 'New York', cityTo: 'London', price: 450, img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=600&q=80' },
    { from: 'SFO', to: 'HND', cityFrom: 'San Francisco', cityTo: 'Tokyo', price: 780, img: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=600&q=80' },
    { from: 'DXB', to: 'CDG', cityFrom: 'Dubai', cityTo: 'Paris', price: 520, img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=600&q=80' },
    { from: 'ORD', to: 'MIA', cityFrom: 'Chicago', cityTo: 'Miami', price: 180, img: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?auto=format&fit=crop&w=600&q=80' },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative hero-pattern text-white pt-20 pb-36 lg:pt-28 lg:pb-44 overflow-hidden border-b border-sky-900/40">
        {/* Ambient lighting glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-sky-500/15 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-2/3 right-10 w-[450px] h-[300px] bg-blue-600/15 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-300 text-xs sm:text-sm font-semibold tracking-wide uppercase mb-6 animate-pulse">
            <Sparkles className="w-4 h-4 text-sky-400" />
            <span>Elevated Aviation • Seamless Bookings</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight">
            Your Journey, <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-sky-200 to-white">Simplified</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-light leading-relaxed">
            Experience next-level airline reservation engineered for effortless travel. Live schedules, transparent fares, and instant reservation confirmation.
          </p>

          {/* Quick Stats Banner */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-slate-400 text-sm">
            <span className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>100% Real-time Inventory</span>
            </span>
            <span className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-sky-400"></span>
              <span>Zero Reservation Fees</span>
            </span>
            <span className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
              <span>Instant Digital E-Ticket</span>
            </span>
          </div>
        </div>

        {/* Floating Flight Search Widget */}
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 -mb-28 lg:-mb-32 mt-12 z-20">
          <div className="bg-white rounded-3xl shadow-2xl shadow-slate-900/30 border border-slate-100 p-6 sm:p-8 text-slate-800">
            <div className="flex items-center justify-between pb-6 border-b border-slate-100 mb-6">
              <div className="flex items-center space-x-2">
                <span className="px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-sky-50 text-sky-700 border border-sky-100">
                  One Way & Roundtrip
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                  Direct live schedule search
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-500">
                Guaranteed Seat Availability
              </div>
            </div>

            <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Origin */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span>Departure City / Code</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="e.g. JFK or New York"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold text-slate-800 placeholder-slate-400 uppercase"
                  />
                </div>
              </div>

              {/* Destination */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-600" />
                  <span>Arrival City / Code</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="e.g. LHR or London"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold text-slate-800 placeholder-slate-400 uppercase"
                  />
                </div>
              </div>

              {/* Travel Date */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <Calendar className="w-3.5 h-3.5 text-sky-600" />
                  <span>Departure Date</span>
                </label>
                <input
                  type="date"
                  value={travelDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold text-slate-800"
                />
              </div>

              {/* Passengers & Submit */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
                  <Users className="w-3.5 h-3.5 text-sky-600" />
                  <span>Passengers</span>
                </label>
                <div className="flex space-x-2">
                  <select
                    value={passengers}
                    onChange={(e) => setPassengers(Number(e.target.value))}
                    className="w-28 px-3 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm font-semibold text-slate-800 bg-white"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? 'Seat' : 'Seats'}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-sky-500 via-sky-600 to-blue-700 hover:from-sky-400 hover:to-blue-600 text-white font-bold rounded-xl px-4 py-3 flex items-center justify-center space-x-2 shadow-lg shadow-sky-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <span>Search</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* Spacer for overlapping floating search widget */}
      <div className="h-10 sm:h-14"></div>

      {/* Available Live Schedules / Featured Flights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-sky-600">
              Live Backend Flight Schedules
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Active Flights Ready For Booking
            </h2>
          </div>
          <button
            onClick={() => navigate('/flights')}
            className="mt-4 md:mt-0 inline-flex items-center space-x-1.5 text-sm font-bold text-sky-600 hover:text-sky-700 group"
          >
            <span>View All Scheduled Flights</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

        {isLoadingFlights ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-44 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : featuredFlights.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
            <Plane className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-700">No scheduled flights found</h3>
            <p className="text-sm text-slate-500 mt-1 mb-4">
              Administrators can add flights via the Admin Console.
            </p>
            <button
              onClick={() => navigate('/flights')}
              className="px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-500"
            >
              Browse All Routes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredFlights.map((flight) => (
              <div
                key={flight.id}
                className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-sky-200 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {flight.flightNumber}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {flight.airlineName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between my-5">
                    <div>
                      <p className="text-2xl font-black text-slate-900">{flight.source}</p>
                      <p className="text-xs text-slate-400 font-medium">Origin</p>
                    </div>

                    <div className="flex flex-col items-center px-4">
                      <div className="flex items-center space-x-1 text-slate-300">
                        <span className="w-8 h-[2px] bg-slate-200"></span>
                        <Plane className="w-4 h-4 text-sky-500 transform rotate-90" />
                        <span className="w-8 h-[2px] bg-slate-200"></span>
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400 mt-1">Direct</span>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-black text-slate-900">{flight.destination}</p>
                      <p className="text-xs text-slate-400 font-medium">Destination</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl mb-4">
                    <span className="flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(flight.departureTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} at {new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </span>
                    <span className="font-semibold text-emerald-600">
                      {flight.availableSeats} seats left
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Starting from</span>
                    <span className="text-xl font-black text-slate-900">${flight.price.toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => navigate(`/book/${flight.id}`)}
                    className="px-4 py-2 bg-slate-900 group-hover:bg-sky-600 text-white rounded-xl text-xs font-bold tracking-wide transition-colors"
                  >
                    Book Seat
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Popular Global Routes */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-sky-600">
            Inspiring Journeys
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
            Top Travel Destinations
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Explore premier international metropolises with curated competitive airfares.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularRoutes.map((route, idx) => (
            <div
              key={idx}
              onClick={() => navigate(`/flights?source=${route.from}&destination=${route.to}&travelDate=${travelDate}&minSeats=1`)}
              className="group cursor-pointer rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-md hover:shadow-2xl transition-all duration-300 relative"
            >
              <div className="h-48 overflow-hidden relative">
                <img
                  src={route.img}
                  alt={route.cityTo}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-900/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                  <div>
                    <p className="text-lg font-bold leading-tight">{route.cityTo}</p>
                    <p className="text-xs text-slate-300">{route.from} → {route.to}</p>
                  </div>
                  <span className="text-xs font-bold bg-sky-500/90 px-2.5 py-1 rounded-full backdrop-blur-sm">
                    from ${route.price}
                  </span>
                </div>
              </div>

              <div className="p-4 flex items-center justify-between text-slate-700 text-xs font-bold group-hover:text-sky-600">
                <span>Search This Route</span>
                <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Vayro Section */}
      <section className="bg-slate-900 text-white py-16 lg:py-20 rounded-3xl max-w-7xl mx-auto px-6 sm:px-12 relative overflow-hidden">
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="max-w-2xl">
          <span className="text-xs font-bold uppercase tracking-widest text-sky-400">
            Why Fly With Vayro
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 leading-tight">
            Aviation Built With Precision, Speed, And Integrity
          </h2>
          <p className="text-slate-300 text-sm sm:text-base mt-4 leading-relaxed">
            From our frictionless booking pipeline to real-time seat locks and verified itineraries, Vayro removes the stress from air travel.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Instant Seat Confirmation</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every confirmed reservation immediately locks inventory at the database level with atomic consistency.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
              <Shield className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Zero Hidden Markups</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              The ticket price you inspect is the final total. We believe in crystal clear transparency from search to boarding.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center mb-4">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Real-Time Schedule Status</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Check scheduled, active, delayed, or cancelled flights with live updates directly from flight operations.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
