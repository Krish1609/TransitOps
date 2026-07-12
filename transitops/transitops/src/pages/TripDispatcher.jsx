import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TripDispatcher = () => {
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Selection/Details
  const [selectedTrip, setSelectedTrip] = useState(null);

  // New Trip Form State
  const [newTrip, setNewTrip] = useState({
    source: '',
    destination: '',
    vehicle_id: '',
    driver_id: '',
    cargo_weight_kg: '',
    planned_distance_km: '',
  });

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  // Complete Trip controls state
  const [completionData, setCompletionData] = useState({
    final_odometer: '',
    fuel_consumed_l: '',
  });
  const [completionError, setCompletionError] = useState('');

  // Fetch all state
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
        axios.get('http://localhost:5000/api/trips', config),
        axios.get('http://localhost:5000/api/vehicles', config),
        axios.get('http://localhost:5000/api/drivers', config)
      ]);

      setTrips(tripsRes.data);
      setVehicles(vehiclesRes.data);
      setDrivers(driversRes.data);

      // Keep selected trip updated
      if (selectedTrip) {
        const updated = tripsRes.data.find(t => t.id === selectedTrip.id);
        if (updated) setSelectedTrip(updated);
      }
    } catch (err) {
      console.error(err);
      setFormError('Failed to synchronize data feeds from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter lists for new trips assignment dropdowns
  const availableVehicles = vehicles.filter(v => v.status === 'Available');
  const eligibleDrivers = drivers.filter(
    d => d.status === 'Available' && !d.license_expired && d.status !== 'Suspended'
  );

  // Dynamic capacity exceed warning calculation
  const selectedVehicleObj = vehicles.find(v => String(v.id) === String(newTrip.vehicle_id));
  const cargoWeightVal = parseFloat(newTrip.cargo_weight_kg) || 0;
  const capacityLimit = selectedVehicleObj ? parseFloat(selectedVehicleObj.max_capacity_kg) : 0;
  const isCapacityExceeded = selectedVehicleObj && cargoWeightVal > capacityLimit;
  const capacityDiff = isCapacityExceeded ? Math.round(cargoWeightVal - capacityLimit) : 0;

  const handleCreateDraftTrip = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    if (!newTrip.source || !newTrip.destination || !newTrip.vehicle_id || !newTrip.driver_id || !newTrip.cargo_weight_kg || !newTrip.planned_distance_km) {
      setFormError('Please fill out all fields to draft a trip.');
      return;
    }

    if (isCapacityExceeded) {
      setFormError('Cannot draft trip: Assigned cargo weight exceeds the vehicle limit.');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const payload = {
        source: newTrip.source.trim(),
        destination: newTrip.destination.trim(),
        vehicle_id: parseInt(newTrip.vehicle_id),
        driver_id: parseInt(newTrip.driver_id),
        cargo_weight_kg: parseFloat(newTrip.cargo_weight_kg),
        planned_distance_km: parseFloat(newTrip.planned_distance_km),
      };

      const res = await axios.post('http://localhost:5000/api/trips', payload, config);
      setFormSuccess(`Draft created successfully! Code: ${res.data.trip_code}`);
      
      // Auto-select newly drafted trip
      setSelectedTrip(res.data);
      
      // Clear form
      setNewTrip({
        source: '',
        destination: '',
        vehicle_id: '',
        driver_id: '',
        cargo_weight_kg: '',
        planned_distance_km: '',
      });

      fetchData();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setFormError(err.response.data.error);
      } else {
        setFormError('Server failed to record draft trip.');
      }
    }
  };

  const handleDispatchTrip = async (tripId) => {
    setFormError('');
    setFormSuccess('');
    try {
      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.post(`http://localhost:5000/api/trips/${tripId}/dispatch`, {}, config);
      setFormSuccess('Trip status promoted to DISPATCHED! Asset and operator keys set to On Trip.');
      fetchData();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        alert(err.response.data.error);
      } else {
        alert('Failed to dispatch trip.');
      }
    }
  };

  const handleCancelTrip = async (tripId) => {
    if (!window.confirm('Are safety teams authorized to abort this trip? Cancelation resets assignments.')) {
      return;
    }
    setFormError('');
    setFormSuccess('');
    try {
      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.post(`http://localhost:5000/api/trips/${tripId}/cancel`, {}, config);
      setFormSuccess('Dispatched trip cancelled. Assets returned to available registries.');
      fetchData();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        alert(err.response.data.error);
      } else {
        alert('Failed to cancel trip.');
      }
    }
  };

  const handleCompleteTripSubmit = async (e) => {
    e.preventDefault();
    setCompletionError('');
    setFormSuccess('');

    const odometerInput = parseFloat(completionData.final_odometer);
    const fuelInput = parseFloat(completionData.fuel_consumed_l);

    if (isNaN(odometerInput) || isNaN(fuelInput)) {
      setCompletionError('Odometer and fuel logs must be numerical.');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const payload = {
        final_odometer: odometerInput,
        fuel_consumed_l: fuelInput
      };

      await axios.post(`http://localhost:5000/api/trips/${selectedTrip.id}/complete`, payload, config);
      setFormSuccess('Trip logged as COMPLETED. Vehicle odometer readings sync updated.');
      setCompletionData({ final_odometer: '', fuel_consumed_l: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setCompletionError(err.response.data.error);
      } else {
        setCompletionError('Failed to log completion state.');
      }
    }
  };

  // Status badge styling helper
  const getStatusBadge = (status) => {
    let style = 'bg-slate-800 border-slate-700 text-slate-400';
    if (status === 'Draft') {
      style = 'bg-yellow-950/40 border-yellow-500/20 text-yellow-500';
    } else if (status === 'Dispatched') {
      style = 'bg-indigo-950/40 border-indigo-500/30 text-indigo-400 font-bold';
    } else if (status === 'Completed') {
      style = 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400';
    } else if (status === 'Cancelled') {
      style = 'bg-red-950/40 border-red-500/20 text-red-400';
    }

    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-bold border uppercase tracking-wider ${style}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight text-left">Trip Dispatch Office</h2>
        <p className="text-xs text-slate-500 text-left">Create, validate, dispatch, and close commercial shipping trips in real-time</p>
      </div>

      {/* Operation Messages */}
      {formSuccess && (
        <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-300 rounded-2xl px-5 py-4 text-xs flex items-center justify-between shadow-lg">
          <div className="flex gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-emerald-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
            </svg>
            <span>{formSuccess}</span>
          </div>
          <button onClick={() => setFormSuccess('')} className="text-slate-400 hover:text-slate-200 text-xs">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: Live board table of trips (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 shadow-md overflow-hidden text-left">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Operational Live Board</h3>
            
            <div className="overflow-x-auto">
              {isLoading && trips.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="animate-spin h-7 w-7 text-indigo-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-slate-400 text-xs">Connecting active boards...</span>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-992 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                      <th className="pb-3 px-3">Trip Code</th>
                      <th className="pb-3 px-3">Origin / Destination</th>
                      <th className="pb-3 px-3">Reg No</th>
                      <th className="pb-3 px-3">Driver</th>
                      <th className="pb-3 px-3 text-center">Weight</th>
                      <th className="pb-3 px-3 text-center">Distance</th>
                      <th className="pb-3 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/30 text-xs">
                    {trips.length > 0 ? (
                      trips.map((t) => {
                        const isSelected = selectedTrip && selectedTrip.id === t.id;
                        return (
                          <tr
                            key={t.id}
                            onClick={() => setSelectedTrip(t)}
                            className={`cursor-pointer transition-all ${isSelected ? 'bg-indigo-950/20 text-indigo-200 border-l-2 border-l-indigo-550' : 'hover:bg-slate-900/10'}`}
                          >
                            <td className="py-4 px-3 font-mono font-bold text-slate-200">{t.trip_code}</td>
                            <td className="py-4 px-3 font-medium">
                              <span className="text-slate-200">{t.source}</span>
                              <span className="text-slate-500 px-1.5">→</span>
                              <span className="text-slate-200">{t.destination}</span>
                            </td>
                            <td className="py-4 px-3 font-medium text-slate-350">{t.reg_no}</td>
                            <td className="py-4 px-3 text-slate-405">{t.driver_name}</td>
                            <td className="py-4 px-3 text-center text-slate-400 font-mono">
                              {parseInt(t.cargo_weight_kg).toLocaleString()} kg
                            </td>
                            <td className="py-4 px-3 text-center text-slate-400 font-mono">
                              {parseInt(t.planned_distance_km).toLocaleString()} km
                            </td>
                            <td className="py-4 px-3">{getStatusBadge(t.status)}</td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate-500 text-xs">
                          No active dispatches logged in the system.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* New Trip Create Form Box inside Left Column */}
          <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 shadow-md text-left">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Create / Draft Dispatch Log</h3>
            <p className="text-[11px] text-slate-500 mb-4">Select qualified assets and drivers. Submit records to prepare dispatch.</p>

            {formError && (
              <div className="bg-red-950/40 border border-red-500/20 text-red-300 rounded-xl p-3 text-[11px] flex gap-2.5 mb-4 items-center">
                <svg className="h-4 w-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{formError}</span>
              </div>
            )}

            {/* ERROR banner with left-accent warning if capacity exceeds */}
            {isCapacityExceeded && (
              <div className="bg-red-950/30 border-l-4 border-red-500 text-red-200 p-4 rounded-r-xl text-xs font-semibold flex items-center justify-between shadow-lg mb-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-405">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                  </svg>
                  <span>Capacity exceeded by {capacityDiff} kg — dispatch blocked</span>
                </div>
              </div>
            )}

            <form onSubmit={handleCreateDraftTrip} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="source-input" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Origin Station *
                  </label>
                  <input
                    id="source-input"
                    type="text"
                    required
                    placeholder="e.g. Denver, CO"
                    value={newTrip.source}
                    onChange={(e) => setNewTrip({ ...newTrip, source: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-805 text-slate-100 placeholder-slate-650 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
                <div>
                  <label htmlFor="dest-input" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Destination Terminal *
                  </label>
                  <input
                    id="dest-input"
                    type="text"
                    required
                    placeholder="e.g. Chicago, IL"
                    value={newTrip.destination}
                    onChange={(e) => setNewTrip({ ...newTrip, destination: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-805 text-slate-100 placeholder-slate-650 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="vehicle-select" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Assign Fleet Vehicle (Available) *
                  </label>
                  <select
                    id="vehicle-select"
                    required
                    value={newTrip.vehicle_id}
                    onChange={(e) => setNewTrip({ ...newTrip, vehicle_id: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-805 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                  >
                    <option value="">Select available asset...</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.reg_no} — {v.name_model} (Max: {parseInt(v.max_capacity_kg).toLocaleString()} kg)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="driver-select" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Assign Operator (Eligible & Active) *
                  </label>
                  <select
                    id="driver-select"
                    required
                    value={newTrip.driver_id}
                    onChange={(e) => setNewTrip({ ...newTrip, driver_id: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-805 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                  >
                    <option value="">Select eligible operator...</option>
                    {eligibleDrivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} (Safety: {d.safety_score})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cargo-input" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Cargo Weight (kg) *
                  </label>
                  <input
                    id="cargo-input"
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 15000"
                    value={newTrip.cargo_weight_kg}
                    onChange={(e) => setNewTrip({ ...newTrip, cargo_weight_kg: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-805 text-slate-105 placeholder-slate-650 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
                <div>
                  <label htmlFor="distance-input" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    planned trip Distance (km) *
                  </label>
                  <input
                    id="distance-input"
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 850"
                    value={newTrip.planned_distance_km}
                    onChange={(e) => setNewTrip({ ...newTrip, planned_distance_km: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-805 text-slate-105 placeholder-slate-650 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isCapacityExceeded}
                  className="px-6 py-2.5 bg-indigo-650 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs transition-all shadow-md"
                >
                  Create Draft Dispatch
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: Selected trip details and action controls (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6 text-left">
          
          <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 shadow-md space-y-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trip Details & Lifecycle</h3>
            
            {selectedTrip ? (
              <div className="space-y-6">
                
                {/* Visual Stepper */}
                <div className="flex justify-between items-center px-2">
                  {['Draft', 'Dispatched', 'Completed'].map((stage, idx) => {
                    const statusesOrdered = ['Draft', 'Dispatched', 'Completed'];
                    const currentIdx = statusesOrdered.indexOf(selectedTrip.status);
                    
                    const isPassed = currentIdx >= idx;
                    const isActive = currentIdx === idx;
                    const isCancelled = selectedTrip.status === 'Cancelled' && idx === 1;

                    let stageColor = 'text-slate-650 bg-slate-950 border-slate-850';
                    if (isActive) {
                      stageColor = 'text-indigo-400 bg-indigo-950/60 border-indigo-500/50 shadow-md shadow-indigo-500/10 scale-110';
                    } else if (isPassed) {
                      stageColor = 'text-emerald-400 bg-emerald-950/30 border-emerald-500/30';
                    } else if (isCancelled) {
                      stageColor = 'text-red-400 bg-red-950/40 border-red-500/30';
                    }

                    return (
                      <div key={stage} className="flex flex-col items-center relative z-10">
                        <div className={`w-8 h-8 rounded-full border text-[10px] font-bold flex items-center justify-center transition-all ${stageColor}`}>
                          {isPassed && !isActive ? '✓' : idx + 1}
                        </div>
                        <span className={`text-[9px] uppercase tracking-wider font-extrabold mt-1.5 ${isActive ? 'text-indigo-400' : isPassed ? 'text-slate-300' : 'text-slate-600'}`}>
                          {selectedTrip.status === 'Cancelled' && idx === 1 ? 'Cancelled' : stage}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="h-px bg-slate-850 my-4" />

                {/* Details list */}
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Trip Identifier:</span>
                    <span className="font-mono font-bold text-white">{selectedTrip.trip_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Route Path:</span>
                    <span className="text-slate-205 font-medium">{selectedTrip.source} → {selectedTrip.destination}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fleet Asset:</span>
                    <span className="text-slate-205 font-medium">{selectedTrip.reg_no} ({selectedTrip.name_model})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Operator Assigned:</span>
                    <span className="text-slate-205 font-medium">{selectedTrip.driver_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Cargo Net Weight:</span>
                    <span className="font-mono text-slate-300">{parseInt(selectedTrip.cargo_weight_kg).toLocaleString()} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Odometer Initial:</span>
                    <span className="font-mono text-slate-350">{parseFloat(selectedTrip.vehicle_odometer).toLocaleString()} km</span>
                  </div>
                  {selectedTrip.final_odometer && (
                    <div className="flex justify-between">
                      <span className="text-slate-505">Odometer Final:</span>
                      <span className="font-mono text-emerald-450">{parseFloat(selectedTrip.final_odometer).toLocaleString()} km</span>
                    </div>
                  )}
                  {selectedTrip.fuel_consumed_l && (
                    <div className="flex justify-between col-span-2">
                      <span className="text-slate-505">Fuel Consumed:</span>
                      <span className="font-mono text-emerald-450">{parseFloat(selectedTrip.fuel_consumed_l).toLocaleString()} Liters</span>
                    </div>
                  )}
                </div>

                <div className="h-px bg-slate-850" />

                {/* Status action buttons */}
                {selectedTrip.status === 'Draft' && (
                  <div className="space-y-3">
                    <button
                      onClick={() => handleDispatchTrip(selectedTrip.id)}
                      className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs tracking-wide transition-all shadow-md"
                    >
                      Authorize & Dispatch Trip
                    </button>
                    <p className="text-[10px] text-slate-500 text-center leading-relaxed">
                      Dispatching validates driver CDL validity, cargo limits, and sets both vehicle/driver state locks to 'On Trip'.
                    </p>
                  </div>
                )}

                {selectedTrip.status === 'Dispatched' && (
                  <div className="space-y-4">
                    {/* COMPLETE TRIP WIDGET FORM */}
                    <form onSubmit={handleCompleteTripSubmit} className="space-y-3 bg-slate-950/40 p-4 border border-slate-900 rounded-2xl">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Logging Completion Logs</h4>

                      {completionError && (
                        <div className="text-[10px] text-red-400 font-semibold bg-red-950/20 border border-red-500/10 p-2 rounded-lg">
                          {completionError}
                        </div>
                      )}

                      <div>
                        <label htmlFor="final-odo" className="block text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Final Vehicle Odometer (km) *
                        </label>
                        <input
                          id="final-odo"
                          type="number"
                          required
                          step="0.1"
                          placeholder={`Min: ${parseFloat(selectedTrip.vehicle_odometer) + parseFloat(selectedTrip.planned_distance_km)} km`}
                          value={completionData.final_odometer}
                          onChange={(e) => setCompletionData({ ...completionData, final_odometer: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>

                      <div>
                        <label htmlFor="fuel-l" className="block text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                          Actual Fuel Consumed (L) *
                        </label>
                        <input
                          id="fuel-l"
                          type="number"
                          required
                          step="0.1"
                          placeholder="e.g. 240.5"
                          value={completionData.fuel_consumed_l}
                          onChange={(e) => setCompletionData({ ...completionData, fuel_consumed_l: e.target.value })}
                          className="w-full bg-slate-950 border border-slate-850 text-slate-100 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-2 bg-emerald-650 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs transition-all shadow-md mt-1"
                      >
                        Finalize & Close Trip
                      </button>
                    </form>

                    {/* CANCEL TRIP */}
                    <button
                      type="button"
                      onClick={() => handleCancelTrip(selectedTrip.id)}
                      className="w-full py-2 border border-red-950/45 hover:border-red-900/60 bg-red-950/10 hover:bg-red-950/20 text-red-400 font-bold rounded-xl text-xs transition-all"
                    >
                      Abort Dispatch / Cancel Trip
                    </button>
                  </div>
                )}

                {selectedTrip.status === 'Completed' && (
                  <div className="bg-emerald-950/15 border border-emerald-500/10 rounded-2xl p-4 text-center">
                    <span className="text-emerald-400 font-bold text-[10px] uppercase tracking-wider">Dispatch Run Complete</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                      This entry is compiled. Related fleet assets and drivers have successfully returned to operational registries.
                    </p>
                  </div>
                )}

                {selectedTrip.status === 'Cancelled' && (
                  <div className="bg-red-950/15 border border-red-500/10 rounded-2xl p-4 text-center">
                    <span className="text-red-400 font-bold text-[10px] uppercase tracking-wider">Dispatch Run Aborted</span>
                    <p className="text-[10px] text-slate-500 leading-relaxed mt-1">
                      This run log was aborted. Allocated components reverted to active registry status.
                    </p>
                  </div>
                )}

              </div>
            ) : (
              <div className="py-16 text-center text-slate-500 text-xs">
                Select a trip from the live board to audit lifecycle statuses or enter completion statistics.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default TripDispatcher;
