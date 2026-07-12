import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Dashboard = () => {
  const [kpis, setKpis] = useState({
    active_vehicles: 0,
    available_vehicles: 0,
    vehicles_in_maintenance: 0,
    vehicles_on_trip: 0,
    active_trips: 0,
    pending_trips: 0,
    drivers_on_duty: 0,
    fleet_utilization: 0,
  });

  const [recentTrips, setRecentTrips] = useState([]);
  const [filteredTrips, setFilteredTrips] = useState([]);
  const [statusCounts, setStatusCounts] = useState({
    Available: 0,
    'On Trip': 0,
    'In Shop': 0,
    Retired: 0,
  });

  const [filters, setFilters] = useState({
    vehicleType: '',
    status: '',
    region: '',
  });

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      
      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const [kpisRes, tripsRes, statusRes] = await Promise.all([
        axios.get('http://localhost:5000/api/dashboard/kpis', config),
        axios.get('http://localhost:5000/api/trips/recent', config),
        axios.get('http://localhost:5000/api/vehicles/status-summary', config),
      ]);

      setKpis(kpisRes.data);
      setRecentTrips(tripsRes.data);
      setFilteredTrips(tripsRes.data);

      const counts = { Available: 0, 'On Trip': 0, 'In Shop': 0, Retired: 0 };
      statusRes.data.forEach((item) => {
        counts[item.status] = Number(item.count || 0);
      });
      setStatusCounts(counts);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to sync telemetry from backend command server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Update client filtered trips whenever filters change
  useEffect(() => {
    let temp = [...recentTrips];

    if (filters.vehicleType) {
      temp = temp.filter((t) =>
        t.name_model.toLowerCase().includes(filters.vehicleType.toLowerCase()) ||
        t.reg_no.toLowerCase().includes(filters.vehicleType.toLowerCase())
      );
    }

    if (filters.status) {
      temp = temp.filter((t) => t.status === filters.status);
    }

    if (filters.region) {
      const q = filters.region.toLowerCase();
      temp = temp.filter(
        (t) =>
          t.source.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q)
      );
    }

    setFilteredTrips(temp);
  }, [filters, recentTrips]);

  const handleResetFilters = () => {
    setFilters({
      vehicleType: '',
      status: '',
      region: '',
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh]">
        <svg className="animate-spin h-8 w-8 text-indigo-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-slate-400 text-sm font-medium">Retrieving Core Metrics...</span>
      </div>
    );
  }

  // Calculate percentages for vehicle status bars
  const totalVehicles = Object.values(statusCounts).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-8 font-sans">
      {/* Error block */}
      {errorMsg && (
        <div className="bg-red-950/40 border border-red-500/20 text-red-300 rounded-2xl px-5 py-4 text-sm flex items-center justify-between shadow-lg">
          <div className="flex gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
          <button onClick={fetchDashboardData} className="text-indigo-400 hover:text-indigo-300 font-semibold underline text-xs">Retry Connect</button>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Utilization Card */}
        <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Fleet Utilization</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
              </svg>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-extrabold text-white">{kpis.fleet_utilization}%</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-indigo-650 h-full rounded-full transition-all duration-500" 
                style={{ width: `${kpis.fleet_utilization}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 block">Vehicles active on duty / total non-retired</span>
          </div>
        </div>

        {/* Vehicle Metrics Card */}
        <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Vehicles Active</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125a1.125 1.125 0 0 0 1.125-1.125V9.75M3.75 14.25h16.5M3.75 14.25V9.75m16.5 4.5v1.5a1.125 1.125 0 0 1-1.125 1.125H18M3.75 14.25H2.25m4.25-5.25L9 3h6l2.75 6h-11Z" />
              </svg>
            </div>
            <div className="text-4xl font-extrabold text-white">{kpis.active_vehicles}</div>
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Available</span>
              <span className="text-emerald-400 font-bold">{kpis.available_vehicles}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">In Shop</span>
              <span className="text-amber-400 font-bold">{kpis.vehicles_in_maintenance}</span>
            </div>
          </div>
        </div>

        {/* Trips Status Card */}
        <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Trips Summary</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.693 2.166 1.638m-7.377 15.631H6.75A2.25 2.25 0 0 1 4.5 17.25V6.75A2.25 2.25 0 0 1 6.75 4.5H9" />
              </svg>
            </div>
            <div className="text-4xl font-extrabold text-white">{kpis.active_trips + kpis.pending_trips}</div>
          </div>
          <div className="mt-4 flex gap-4 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Active</span>
              <span className="text-indigo-400 font-bold">{kpis.active_trips}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Pending</span>
              <span className="text-orange-400 font-bold">{kpis.pending_trips}</span>
            </div>
          </div>
        </div>

        {/* Drivers Guard Unit */}
        <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 flex flex-col justify-between shadow-md">
          <div>
            <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <span>Drivers on Duty</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-indigo-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
              </svg>
            </div>
            <div className="text-4xl font-extrabold text-white">{kpis.drivers_on_duty}</div>
          </div>
          <div className="mt-4">
            <span className="text-xs text-slate-400">Operational matching load ratio:</span>
            <span className="text-slate-200 text-xs ml-1 font-semibold">Ready</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Filters & Status Summary Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Filters Panel (Client-Side) */}
        <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white tracking-wide">Operational Control Filter</h3>
            <button 
              onClick={handleResetFilters}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
            >
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="vehicleType" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Vehicle Key
              </label>
              <input
                id="vehicleType"
                type="text"
                value={filters.vehicleType}
                onChange={(e) => setFilters({ ...filters, vehicleType: e.target.value })}
                placeholder="Search model or reg no"
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-xl px-4 py-2.5 text-xs transition-all focus:outline-none focus:border-indigo-500/70"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Trip Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/70"
              >
                <option value="">All Statuses</option>
                <option value="Draft">Draft</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label htmlFor="region" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Region / Destination
              </label>
              <input
                id="region"
                type="text"
                value={filters.region}
                onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                placeholder="e.g. Denver, Dallas"
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-xl px-4 py-2.5 text-xs transition-all focus:outline-none focus:border-indigo-500/70"
              />
            </div>
          </div>
        </div>

        {/* Vehicle Status Distribution Bars */}
        <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 shadow-md">
          <h3 className="text-base font-bold text-white mb-4 tracking-wide">Vehicle Status Allocation</h3>
          <div className="space-y-4">
            {/* Available Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium">Available</span>
                <span className="text-slate-200 font-bold">{statusCounts.Available}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${(statusCounts.Available / totalVehicles) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* On Trip Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium">On Trip</span>
                <span className="text-slate-200 font-bold">{statusCounts['On Trip']}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all"
                  style={{ width: `${(statusCounts['On Trip'] / totalVehicles) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* In Shop Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium">In Shop (Maintenance)</span>
                <span className="text-slate-200 font-bold">{statusCounts['In Shop']}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${(statusCounts['In Shop'] / totalVehicles) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Retired Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-400 font-medium">Retired</span>
                <span className="text-slate-200 font-bold">{statusCounts.Retired}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-slate-700 h-full rounded-full transition-all"
                  style={{ width: `${(statusCounts.Retired / totalVehicles) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trips Table */}
      <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 shadow-md overflow-hidden">
        <h3 className="text-base font-bold text-white mb-4 tracking-wide">Recent Operational Deliveries</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                <th className="pb-3 px-4">Trip Code</th>
                <th className="pb-3 px-4">Origin / Destination</th>
                <th className="pb-3 px-4">Asset / Driver</th>
                <th className="pb-3 px-4">Cargo Weight</th>
                <th className="pb-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/30 text-xs">
              {filteredTrips.length > 0 ? (
                filteredTrips.map((trip) => {
                  let statusColor = 'bg-slate-800 border-slate-700 text-slate-300';
                  if (trip.status === 'Completed') {
                    statusColor = 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400';
                  } else if (trip.status === 'Dispatched') {
                    statusColor = 'bg-indigo-950/40 border-indigo-500/20 text-indigo-400';
                  } else if (trip.status === 'Draft') {
                    statusColor = 'bg-orange-950/40 border-orange-500/20 text-orange-400';
                  } else if (trip.status === 'Cancelled') {
                    statusColor = 'bg-red-950/40 border-red-500/20 text-red-400';
                  }

                  return (
                    <tr key={trip.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="py-4 px-4 font-mono font-medium text-slate-350">{trip.trip_code}</td>
                      <td className="py-4 px-4">
                        <div className="text-slate-200 font-semibold">{trip.destination}</div>
                        <div className="text-[10px] text-slate-500">From {trip.source}</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-slate-200 font-semibold">{trip.name_model}</div>
                        <div className="text-[10px] text-slate-500">{trip.reg_no} • {trip.driver_name}</div>
                      </td>
                      <td className="py-4 px-4 font-medium text-slate-350">
                        {Number(trip.cargo_weight_kg).toLocaleString()} kg
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${statusColor}`}>
                          {trip.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-slate-500 text-sm">
                    No active trips match the current filter parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
