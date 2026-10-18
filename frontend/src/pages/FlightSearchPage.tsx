import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Plane, Calendar, MapPin, Users, ArrowUpDown, Clock, Filter, AlertCircle } from 'lucide-react';
import { flightApi } from '../api/flights';
import { Flight, PageResponse } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getErrorMessage } from '../api/client';

export const FlightSearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Search parameters
  const [source, setSource] = useState(searchParams.get('source') || '');
  const [destination, setDestination] = useState(searchParams.get('destination') || '');
  const [travelDate, setTravelDate] = useState(searchParams.get('travelDate') || '');
  const [minSeats, setMinSeats] = useState(Number(searchParams.get('minSeats')) || 1);
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'departureTime');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>((searchParams.get('sortDir') as 'asc' | 'desc') || 'asc');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 0);

  // Results state
  const [flightsPage, setFlightsPage] = useState<PageResponse<Flight> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchFlights = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const hasSearchParams = source.trim() && destination.trim() && travelDate;

    try {
      if (hasSearchParams) {
        const response = await flightApi.searchFlights({
          source: source.trim().toUpperCase(),
          destination: destination.trim().toUpperCase(),
          travelDate,
          minSeats,
          page,
          size: 10,
          sortBy,
          sortDir,
        });
        setFlightsPage(response);
      } else {
        // Fallback: list all available flights with sorting
        const response = await flightApi.getAllFlights(page, 10, sortBy, sortDir);
        setFlightsPage(response);
      }
    } catch (err) {
      setErrorMessage(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }, [source, destination, travelDate, minSeats, page, sortBy, sortDir]);

  useEffect(() => {
    fetchFlights();
  }, [fetchFlights]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    const newParams: Record<string, string> = {
      page: '0',
      sortBy,
      sortDir,
      minSeats: minSeats.toString(),
    };
    if (source.trim()) newParams.source = source.trim().toUpperCase();
    if (destination.trim()) newParams.destination = destination.trim().toUpperCase();
    if (travelDate) newParams.travelDate = travelDate;

    setSearchParams(newParams);
  };

  const calculateDuration = (departure: string, arrival: string) => {
    const dep = new Date(departure).getTime();
    const arr = new Date(arrival).getTime();
    const diffMs = arr - dep;
    if (isNaN(diffMs) || diffMs <= 0) return 'Direct';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Available Flight Schedules
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Browse real-time scheduled flights or filter by origin, destination, and departure date.
        </p>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
          <div className="lg:col-span-1 space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              <span>Origin</span>
            </label>
            <input
              type="text"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              placeholder="e.g. JFK"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold uppercase focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="lg:col-span-1 space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500 flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-sky-600" />
              <span>Destination</span>
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. LHR"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold uppercase focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="lg:col-span-1 space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500 flex items-center space-x-1">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>Date</span>
            </label>
            <input
              type="date"
              value={travelDate}
              onChange={(e) => setTravelDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="lg:col-span-1 space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500 flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-sky-600" />
              <span>Seats</span>
            </label>
            <select
              value={minSeats}
              onChange={(e) => setMinSeats(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:ring-2 focus:ring-sky-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((s) => (
                <option key={s} value={s}>
                  {s} {s === 1 ? 'Passenger' : 'Passengers'}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-1 space-y-1">
            <label className="text-xs font-bold uppercase text-slate-500 flex items-center space-x-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-sky-600" />
              <span>Sort By</span>
            </label>
            <select
              value={`${sortBy}-${sortDir}`}
              onChange={(e) => {
                const [sb, sd] = e.target.value.split('-');
                setSortBy(sb);
                setSortDir(sd as 'asc' | 'desc');
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:ring-2 focus:ring-sky-500"
            >
              <option value="departureTime-asc">Departure (Earliest)</option>
              <option value="departureTime-desc">Departure (Latest)</option>
              <option value="price-asc">Price (Lowest first)</option>
              <option value="price-desc">Price (Highest first)</option>
              <option value="availableSeats-desc">Seats Available</option>
            </select>
          </div>

          <div className="lg:col-span-1 flex space-x-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-600/20 transition-all flex items-center justify-center space-x-1"
            >
              <Filter className="w-4 h-4" />
              <span>Filter</span>
            </button>
          </div>
        </form>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold">Search query error</h4>
            <p className="text-xs mt-0.5 text-red-700">{errorMessage}</p>
          </div>
          <button
            onClick={fetchFlights}
            className="text-xs font-bold underline hover:text-red-900"
          >
            Retry
          </button>
        </div>
      )}

      {/* Results Content */}
      {isLoading ? (
        <LoadingSpinner message="Searching verified flight inventory..." />
      ) : !flightsPage || flightsPage.content.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Plane className="w-8 h-8 transform -rotate-45" />
          </div>
          <h3 className="text-xl font-bold text-slate-800">No Flights Found</h3>
          <p className="text-sm text-slate-500 leading-relaxed">
            We couldn't find any scheduled flights matching your criteria. Try adjusting your departure city, destination, or date.
          </p>
          <button
            onClick={() => {
              setSource('');
              setDestination('');
              setTravelDate('');
              setSearchParams({});
            }}
            className="px-5 py-2.5 bg-slate-900 text-white text-sm font-semibold rounded-xl hover:bg-slate-800"
          >
            Clear Filters & View All Flights
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 px-1">
            <span>Found {flightsPage.totalElements} flight{flightsPage.totalElements === 1 ? '' : 's'}</span>
            <span>Page {flightsPage.pageNumber + 1} of {flightsPage.totalPages || 1}</span>
          </div>

          <div className="space-y-4">
            {flightsPage.content.map((flight) => {
              const depDate = new Date(flight.departureTime);
              const arrDate = new Date(flight.arrivalTime);
              const duration = calculateDuration(flight.departureTime, flight.arrivalTime);
              const isEligible = flight.availableSeats >= minSeats && (flight.status === 'SCHEDULED' || flight.status === 'ACTIVE');

              return (
                <div
                  key={flight.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col lg:flex-row items-center justify-between gap-6"
                >
                  {/* Airline & Flight Number */}
                  <div className="w-full lg:w-48 flex lg:flex-col items-center lg:items-start justify-between">
                    <div>
                      <span className="text-xs font-black tracking-wider text-sky-600 bg-sky-50 px-2.5 py-1 rounded-md uppercase">
                        {flight.flightNumber}
                      </span>
                      <h3 className="text-sm font-bold text-slate-800 mt-2">{flight.airlineName}</h3>
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full mt-2 uppercase tracking-wider ${
                        flight.status === 'SCHEDULED' || flight.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : flight.status === 'DELAYED'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {flight.status}
                    </span>
                  </div>

                  {/* Flight Route and Schedule */}
                  <div className="flex-1 w-full flex items-center justify-between max-w-xl">
                    {/* Origin */}
                    <div className="text-left">
                      <p className="text-2xl font-black text-slate-900 tracking-tight">
                        {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-base font-bold text-slate-700">{flight.source}</p>
                      <p className="text-xs text-slate-400">
                        {depDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Timeline & Duration */}
                    <div className="flex flex-col items-center px-4 flex-1">
                      <span className="text-xs font-bold text-slate-500 mb-1">{duration}</span>
                      <div className="w-full flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full border-2 border-sky-600 bg-white"></div>
                        <div className="flex-1 h-[2px] bg-slate-200 relative">
                          <Plane className="w-3.5 h-3.5 text-sky-600 absolute left-1/2 -top-1.5 -translate-x-1/2" />
                        </div>
                        <div className="w-2 h-2 rounded-full bg-slate-900"></div>
                      </div>
                      <span className="text-[11px] font-medium text-slate-400 mt-1">Non-stop Direct</span>
                    </div>

                    {/* Destination */}
                    <div className="text-right">
                      <p className="text-2xl font-black text-slate-900 tracking-tight">
                        {arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      <p className="text-base font-bold text-slate-700">{flight.destination}</p>
                      <p className="text-xs text-slate-400">
                        {arrDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Seat availability & Price / Booking Action */}
                  <div className="w-full lg:w-48 flex lg:flex-col items-center lg:items-end justify-between border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                    <div className="text-left lg:text-right">
                      <span className="text-2xl font-black text-slate-900">${flight.price.toFixed(2)}</span>
                      <span className="text-xs text-slate-400 block">per passenger</span>
                      <span className="text-[11px] font-semibold text-emerald-600 block mt-0.5">
                        {flight.availableSeats} seats remaining
                      </span>
                    </div>

                    <button
                      disabled={!isEligible}
                      onClick={() => navigate(`/book/${flight.id}?passengers=${minSeats}`)}
                      className={`mt-3 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
                        isEligible
                          ? 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/25 hover:scale-[1.02]'
                          : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                      }`}
                    >
                      {isEligible ? 'Book Flight' : 'Unavailable'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {flightsPage.totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 pt-6">
              <button
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-600 px-3">
                {page + 1} of {flightsPage.totalPages}
              </span>
              <button
                disabled={flightsPage.isLast}
                onClick={() => setPage((p) => p + 1)}
                className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
