import React, { useState, useEffect, useCallback } from 'react';
import {
  Plane,
  PlusCircle,
  Calendar,
  Clock,
  Edit2,
  Activity,
  Users,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileSpreadsheet,
  RefreshCw,
  X,
} from 'lucide-react';
import { adminApi } from '../api/admin';
import { flightApi } from '../api/flights';
import { Flight, BookingResponse, FlightStatus, FlightRequest, PageResponse } from '../types';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getErrorMessage } from '../api/client';

export const AdminDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'flights' | 'bookings'>('flights');

  // Flights state
  const [flightsPage, setFlightsPage] = useState<PageResponse<Flight>>({
    content: [],
    pageNumber: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
    isLast: true,
  });
  const [flightsPageNum, setFlightsPageNum] = useState(0);
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);

  // Bookings state
  const [bookingsPage, setBookingsPage] = useState<PageResponse<BookingResponse>>({
    content: [],
    pageNumber: 0,
    pageSize: 10,
    totalElements: 0,
    totalPages: 0,
    isLast: true,
  });
  const [bookingsPageNum, setBookingsPageNum] = useState(0);
  const [isLoadingBookings, setIsLoadingBookings] = useState(false);

  // Modal states
  const [isFlightModalOpen, setIsFlightModalOpen] = useState(false);
  const [editingFlight, setEditingFlight] = useState<Flight | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTargetFlight, setStatusTargetFlight] = useState<Flight | null>(null);
  const [newStatus, setNewStatus] = useState<FlightStatus>('SCHEDULED');

  // Flight form state
  const [flightNumber, setFlightNumber] = useState('');
  const [airlineName, setAirlineName] = useState('Vayro Airways');
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [departureTime, setDepartureTime] = useState('');
  const [arrivalTime, setArrivalTime] = useState('');
  const [totalSeats, setTotalSeats] = useState(150);
  const [price, setPrice] = useState(250);

  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const fetchFlights = useCallback(async () => {
    setIsLoadingFlights(true);
    try {
      const data = await flightApi.getAllFlights(flightsPageNum, 10, 'departureTime', 'desc');
      setFlightsPage(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingFlights(false);
    }
  }, [flightsPageNum]);

  const fetchBookings = useCallback(async () => {
    setIsLoadingBookings(true);
    try {
      const data = await adminApi.getAllBookings(bookingsPageNum, 10, 'bookedAt', 'desc');
      setBookingsPage(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingBookings(false);
    }
  }, [bookingsPageNum]);

  useEffect(() => {
    if (activeTab === 'flights') {
      fetchFlights();
    } else {
      fetchBookings();
    }
  }, [activeTab, fetchFlights, fetchBookings]);

  const handleOpenCreateFlight = () => {
    setEditingFlight(null);
    setFlightNumber(`VR-${Math.floor(100 + Math.random() * 900)}`);
    setAirlineName('Vayro Airways');
    setSource('JFK');
    setDestination('LHR');

    // Default departure tomorrow at 10:00
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(10, 0, 0, 0);
    const arr = new Date(tomorrow);
    arr.setHours(18, 30, 0, 0);

    const formatToLocalISO = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    setDepartureTime(formatToLocalISO(tomorrow));
    setArrivalTime(formatToLocalISO(arr));
    setTotalSeats(180);
    setPrice(320);
    setFormError(null);
    setIsFlightModalOpen(true);
  };

  const handleOpenEditFlight = (flight: Flight) => {
    setEditingFlight(flight);
    setFlightNumber(flight.flightNumber);
    setAirlineName(flight.airlineName);
    setSource(flight.source);
    setDestination(flight.destination);

    // Backend expects yyyy-MM-ddTHH:mm:ss
    const formatForInput = (isoStr: string) => {
      return isoStr.substring(0, 16);
    };

    setDepartureTime(formatForInput(flight.departureTime));
    setArrivalTime(formatForInput(flight.arrivalTime));
    setTotalSeats(flight.totalSeats);
    setPrice(flight.price);
    setFormError(null);
    setIsFlightModalOpen(true);
  };

  const handleSaveFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);

    // Format ISO string to include seconds if missing
    const formatPayloadDate = (val: string) => {
      return val.length === 16 ? `${val}:00` : val;
    };

    const payload: FlightRequest = {
      flightNumber: flightNumber.trim().toUpperCase(),
      airlineName: airlineName.trim(),
      source: source.trim().toUpperCase(),
      destination: destination.trim().toUpperCase(),
      departureTime: formatPayloadDate(departureTime),
      arrivalTime: formatPayloadDate(arrivalTime),
      totalSeats: Number(totalSeats),
      price: Number(price),
    };

    try {
      if (editingFlight) {
        await adminApi.updateFlight(editingFlight.id, payload);
        showToast(`Flight ${payload.flightNumber} successfully updated.`);
      } else {
        await adminApi.createFlight(payload);
        showToast(`Flight ${payload.flightNumber} successfully scheduled.`);
      }
      setIsFlightModalOpen(false);
      fetchFlights();
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenStatusModal = (flight: Flight) => {
    setStatusTargetFlight(flight);
    setNewStatus(flight.status);
    setIsStatusModalOpen(true);
  };

  const handleSaveStatus = async () => {
    if (!statusTargetFlight) return;
    setIsSaving(true);
    try {
      await adminApi.updateFlightStatus(statusTargetFlight.id, newStatus);
      showToast(`Operational status for ${statusTargetFlight.flightNumber} set to ${newStatus}.`);
      setIsStatusModalOpen(false);
      fetchFlights();
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Toast alert */}
      {successToast && (
        <div className="fixed top-24 right-8 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center space-x-2 text-sm font-semibold animate-bounce">
          <CheckCircle2 className="w-5 h-5" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
            Administrative Operations
          </span>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2">
            Vayro Mission Control
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Publish schedules, control operational flight states, and monitor all platform bookings.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => (activeTab === 'flights' ? fetchFlights() : fetchBookings())}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="Refresh Table"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          {activeTab === 'flights' && (
            <button
              onClick={handleOpenCreateFlight}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-sm font-bold shadow-md shadow-sky-600/20 transition-all"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Schedule New Flight</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('flights')}
          className={`flex items-center space-x-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'flights'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Plane className="w-4 h-4" />
          <span>Flight Schedules ({flightsPage.totalElements})</span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex items-center space-x-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'bookings'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Platform Reservations ({bookingsPage.totalElements})</span>
        </button>
      </div>

      {/* Flights Tab Content */}
      {activeTab === 'flights' && (
        <div className="space-y-4">
          {isLoadingFlights ? (
            <LoadingSpinner message="Loading flight schedules..." />
          ) : flightsPage.content.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
              <Plane className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700">No flights registered</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">Click below to publish your first flight.</p>
              <button
                onClick={handleOpenCreateFlight}
                className="px-4 py-2 bg-sky-600 text-white rounded-xl text-xs font-bold"
              >
                Schedule New Flight
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Flight</th>
                      <th className="px-6 py-4">Route</th>
                      <th className="px-6 py-4">Departure / Arrival</th>
                      <th className="px-6 py-4">Seats (Avail/Total)</th>
                      <th className="px-6 py-4">Price</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {flightsPage.content.map((flight) => {
                      const dep = new Date(flight.departureTime);
                      const arr = new Date(flight.arrivalTime);

                      return (
                        <tr key={flight.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                              {flight.flightNumber}
                            </span>
                            <span className="block text-[11px] text-slate-500 mt-0.5">
                              {flight.airlineName}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-900">{flight.source}</span>
                            <span className="text-slate-400 mx-1.5">→</span>
                            <span className="font-bold text-slate-900">{flight.destination}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <span>{dep.toLocaleDateString([], { month: 'short', day: 'numeric' })} at {dep.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="block text-slate-400 text-[10px]">
                                Arrives: {arr.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-emerald-600">{flight.availableSeats}</span>
                            <span className="text-slate-400"> / {flight.totalSeats}</span>
                          </td>
                          <td className="px-6 py-4 font-black text-slate-900">
                            ${flight.price.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                flight.status === 'SCHEDULED' || flight.status === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : flight.status === 'DELAYED'
                                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {flight.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => handleOpenStatusModal(flight)}
                                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600"
                                title="Change Status"
                              >
                                <Activity className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleOpenEditFlight(flight)}
                                className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-600"
                                title="Edit Flight Details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {flightsPage.totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Page {flightsPage.pageNumber + 1} of {flightsPage.totalPages}</span>
                  <div className="flex space-x-2">
                    <button
                      disabled={flightsPageNum === 0}
                      onClick={() => setFlightsPageNum((p) => Math.max(0, p - 1))}
                      className="px-3 py-1.5 border rounded-lg disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={flightsPage.isLast}
                      onClick={() => setFlightsPageNum((p) => p + 1)}
                      className="px-3 py-1.5 border rounded-lg disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bookings Tab Content */}
      {activeTab === 'bookings' && (
        <div className="space-y-4">
          {isLoadingBookings ? (
            <LoadingSpinner message="Retrieving platform reservations..." />
          ) : bookingsPage.content.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
              <FileSpreadsheet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700">No customer reservations yet</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bookings made across the platform will appear here in real time.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4">Reference</th>
                      <th className="px-6 py-4">Customer</th>
                      <th className="px-6 py-4">Flight / Route</th>
                      <th className="px-6 py-4">Passengers</th>
                      <th className="px-6 py-4">Total Amount</th>
                      <th className="px-6 py-4">Booked At</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {bookingsPage.content.map((b) => {
                      const bookedDate = new Date(b.bookedAt);
                      const isConfirmed = b.bookingStatus === 'CONFIRMED';

                      return (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4">
                            <span className="font-mono font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded">
                              {b.bookingReference}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-bold text-slate-900 block">{b.userFullName || 'Customer'}</span>
                            <span className="text-[11px] text-slate-500">{b.userEmail || `User #${b.userId}`}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-900">
                              {b.flightNumber} ({b.source} → {b.destination})
                            </span>
                            <span className="block text-[11px] text-slate-400">{b.airlineName}</span>
                          </td>
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            {b.numberOfPassengers}
                          </td>
                          <td className="px-6 py-4 font-black text-slate-900">
                            ${b.totalPrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-[11px]">
                            {bookedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })} at {bookedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                isConfirmed
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {b.bookingStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {bookingsPage.totalPages > 1 && (
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <span>Page {bookingsPage.pageNumber + 1} of {bookingsPage.totalPages}</span>
                  <div className="flex space-x-2">
                    <button
                      disabled={bookingsPageNum === 0}
                      onClick={() => setBookingsPageNum((p) => Math.max(0, p - 1))}
                      className="px-3 py-1.5 border rounded-lg disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      disabled={bookingsPage.isLast}
                      onClick={() => setBookingsPageNum((p) => p + 1)}
                      className="px-3 py-1.5 border rounded-lg disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Flight Modal */}
      {isFlightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900">
                  {editingFlight ? `Update Flight ${editingFlight.flightNumber}` : 'Schedule New Flight'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct submission to Spring Boot AdminFlightController
                </p>
              </div>
              <button
                onClick={() => setIsFlightModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl font-medium flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveFlight} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-600">Flight Number</label>
                  <input
                    type="text"
                    required
                    value={flightNumber}
                    onChange={(e) => setFlightNumber(e.target.value)}
                    placeholder="VR-101"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold uppercase focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-600">Airline Name</label>
                  <input
                    type="text"
                    required
                    value={airlineName}
                    onChange={(e) => setAirlineName(e.target.value)}
                    placeholder="Vayro Airways"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-600">Origin Airport Code</label>
                  <input
                    type="text"
                    required
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder="JFK"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold uppercase focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-600">Destination Airport Code</label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    placeholder="LHR"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold uppercase focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-600">Departure Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={departureTime}
                    onChange={(e) => setDepartureTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-600">Arrival Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={arrivalTime}
                    onChange={(e) => setArrivalTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-600">Total Capacity (Seats)</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={totalSeats}
                    onChange={(e) => setTotalSeats(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-slate-600">Ticket Price (USD)</label>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    required
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFlightModalOpen(false)}
                  className="flex-1 py-3 border border-slate-200 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-sm shadow-md shadow-sky-600/20 disabled:opacity-50"
                >
                  {isSaving ? 'Saving Flight...' : editingFlight ? 'Update Schedule' : 'Publish Flight'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Flight Status Modal */}
      {isStatusModalOpen && statusTargetFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Update Status: {statusTargetFlight.flightNumber}
            </h3>
            <p className="text-xs text-slate-500">
              Change the operational dispatch state for this flight.
            </p>

            <div className="space-y-2">
              {(['SCHEDULED', 'ACTIVE', 'DELAYED', 'CANCELLED', 'COMPLETED'] as FlightStatus[]).map((st) => (
                <label
                  key={st}
                  className={`flex items-center space-x-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    newStatus === st ? 'border-sky-500 bg-sky-50/50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="flightStatus"
                    value={st}
                    checked={newStatus === st}
                    onChange={() => setNewStatus(st)}
                    className="text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-xs font-bold text-slate-800">{st}</span>
                </label>
              ))}
            </div>

            <div className="flex space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsStatusModalOpen(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving}
                onClick={handleSaveStatus}
                className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/20 disabled:opacity-50"
              >
                {isSaving ? 'Updating...' : 'Save Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
