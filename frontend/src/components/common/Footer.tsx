import React from 'react';
import { Plane, ShieldCheck, Clock, Award, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800">
      {/* Feature highlight strip */}
      <div className="border-b border-slate-800/80 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Verified Reliability</h4>
                <p className="text-xs text-slate-400">Guaranteed seat allocations</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Real-time Schedules</h4>
                <p className="text-xs text-slate-400">Up-to-the-minute status updates</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Transparent Pricing</h4>
                <p className="text-xs text-slate-400">Zero hidden booking surcharges</p>
              </div>
            </div>

            <div className="flex items-center justify-center md:justify-start space-x-3.5">
              <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-white font-semibold text-sm">Global Routes</h4>
                <p className="text-xs text-slate-400">Seamless metropolitan travel</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500 flex items-center justify-center text-white">
                <Plane className="w-5 h-5 transform -rotate-45" />
              </div>
              <span className="text-xl font-bold tracking-wider text-white">VAYRO</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Vayro is next-generation aviation engineering made effortless. Discover seamless travel scheduling, real-time availability, and instant reservation confirmation.
            </p>
            <p className="text-xs text-sky-400 font-semibold tracking-wider uppercase">
              "Your Journey, Simplified"
            </p>
          </div>

          <div>
            <h5 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Flight Services</h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/flights" className="hover:text-white transition-colors">
                  Search Flight Schedules
                </Link>
              </li>
              <li>
                <Link to="/flights?source=JFK&destination=LHR" className="hover:text-white transition-colors">
                  New York to London
                </Link>
              </li>
              <li>
                <Link to="/flights?source=SFO&destination=NRT" className="hover:text-white transition-colors">
                  San Francisco to Tokyo
                </Link>
              </li>
              <li>
                <Link to="/flights?source=DXB&destination=CDG" className="hover:text-white transition-colors">
                  Dubai to Paris
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">Traveler Portal</h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/my-bookings" className="hover:text-white transition-colors">
                  Manage Reservations
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Customer Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Create Vayro Account
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h5 className="text-white font-semibold text-sm mb-4 tracking-wide uppercase">System Information</h5>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>API Gateway: Online</span>
              </li>
              <li>
                <a
                  href="http://localhost:8080/swagger-ui/index.html"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-white transition-colors"
                >
                  Swagger OpenAPI Docs
                </a>
              </li>
              <li className="text-xs text-slate-500 pt-2">
                Spring Boot 3.3.4 Backend + Vite React TS Frontend
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Vayro Airlines Ltd. All rights reserved.</p>
          <p className="text-slate-500">
            Secure Rest API Platform • Role-Based Access Control • High-Precision Seat Reservation
          </p>
        </div>
      </div>
    </footer>
  );
};
