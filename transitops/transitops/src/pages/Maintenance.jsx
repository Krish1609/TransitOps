import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Maintenance = () => {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    vehicle_id: '',
    service_type: '',
    cost: '',
    service_date: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const [logsRes, vehiclesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/maintenance', config),
        axios.get('http://localhost:5000/api/vehicles', config)
      ]);

      // Complete fetch
      setLogs(logsRes.data);
      setVehicles(vehiclesRes.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to sync details from maintenance database.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.vehicle_id || !formData.service_type || !formData.cost || !formData.service_date) {
      setErrorMsg('Please populate all available fields.');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const payload = {
        vehicle_id: parseInt(formData.vehicle_id),
        service_type: formData.service_type.trim(),
        cost: parseFloat(formData.cost),
        service_date: formData.service_date,
      };

      await axios.post('http://localhost:5000/api/maintenance', payload, config);
      setSuccessMsg('Service card logged successfully! Vehicle status set to In Shop.');
      
      // Reset form (except date)
      setFormData({
        vehicle_id: '',
        service_type: '',
        cost: '',
        service_date: new Date().toISOString().split('T')[0],
      });

      fetchData();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg('Failed to create maintenance log.');
      }
    }
  };

  const handleCompleteService = async (logId) => {
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.put(`http://localhost:5000/api/maintenance/${logId}/complete`, {}, config);
      setSuccessMsg('Service logged as Completed. Vehicle registry has been updated to Available.');
      fetchData();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg('Failed to finalize maintenance service.');
      }
    }
  };

  // Filter vehicles: exclude Retired
  const eligibleVehicles = vehicles.filter(v => v.status !== 'Retired');

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight text-left">Fleet Maintenance</h2>
        <p className="text-xs text-slate-500 text-left">Schedule service intervals, track repair costs, and transition shop statuses</p>
      </div>

      {errorMsg && (
        <div className="bg-red-950/40 border border-red-500/20 text-red-300 rounded-2xl px-5 py-4 text-xs flex gap-3 text-left">
          <svg className="h-4 w-4 text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-350 rounded-2xl px-5 py-4 text-xs flex gap-3 text-left">
          <svg className="h-4 w-4 text-emerald-450 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Log Service Record Form (col-span-1) */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 shadow-md text-left">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Log Service Record</h3>
            <p className="text-[11px] text-slate-500 mb-4">Registering service locks the vehicle state to In Shop status.</p>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* Vehicle Select */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Target Vehicle *
                </label>
                <select
                  required
                  value={formData.vehicle_id}
                  onChange={(e) => setFormData({ ...formData, vehicle_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                >
                  <option value="">Select vehicle...</option>
                  {eligibleVehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.reg_no} — {v.name_model} ({v.status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Service Type */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Service / Repair Type *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Engine Oil, Brake replacement"
                  value={formData.service_type}
                  onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 text-slate-100 placeholder-slate-650 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                />
              </div>

              {/* Cost & Date Group */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Cost ($) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    placeholder="e.g. 350.00"
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 text-slate-101 placeholder-slate-650 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Service Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.service_date}
                    onChange={(e) => setFormData({ ...formData, service_date: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 text-slate-101 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition-all shadow-md mt-1"
              >
                Log Maintenance Sheet
              </button>
            </form>
          </div>

          {/* Visual Status Transition Diagram Card */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-6 shadow-md text-left space-y-4">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Automatic Registry Status Sync</h4>
            <div className="border border-slate-850 rounded-2xl p-4 bg-slate-950/40 flex items-center justify-around">
              
              <div className="flex flex-col items-center gap-1.5">
                <div className="px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 text-[10px] font-bold">
                  Available
                </div>
                <span className="text-[9px] text-slate-500">Normal State</span>
              </div>

              {/* Toggling arrows */}
              <div className="flex flex-col items-center text-slate-600">
                <span className="text-xs font-mono">────►</span>
                <span className="text-[9px] font-bold text-slate-405 my-0.5">Auto-updates</span>
                <span className="text-xs font-mono">◄────</span>
              </div>

              <div className="flex flex-col items-center gap-1.5">
                <div className="px-3 py-1.5 rounded-full border border-amber-505/20 bg-amber-955/20 text-amber-400 text-[10px] font-bold">
                  In Shop
                </div>
                <span className="text-[9px] text-slate-500">Service Active</span>
              </div>

            </div>
            <p className="text-[10.5px] leading-relaxed text-slate-450">
              When a service log card is submitted, the vehicle configuration toggles to **In Shop**. Closing and completing the card reverts the status to **Available** automatically.
            </p>
          </div>

        </div>

        {/* RIGHT COLUMN: Service logs table (col-span-2) */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 shadow-md overflow-hidden text-left">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Service Record Ledger</h3>

            <div className="overflow-x-auto">
              {isLoading && logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="animate-spin h-7 w-7 text-indigo-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-slate-400 text-xs">Syncing service ledger...</span>
                </div>
              ) : (
                <table className="w-full text-none">
                  <thead>
                    <tr className="border-b border-slate-992 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                      <th className="pb-3 px-3">Vehicle</th>
                      <th className="pb-3 px-3">Service / Repair Type</th>
                      <th className="pb-3 px-3 text-right">Cost</th>
                      <th className="pb-3 px-3">Date</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900/30 text-xs">
                    {logs.length > 0 ? (
                      logs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-900/10 transition-colors">
                          <td className="py-4 px-3 font-semibold text-slate-205">
                            <div>{log.reg_no}</div>
                            <div className="text-[10px] text-slate-550 font-normal">{log.name_model}</div>
                          </td>
                          <td className="py-4 px-3 text-slate-300 font-medium">{log.service_type}</td>
                          <td className="py-4 px-3 text-right text-slate-350 font-mono">
                            ${parseFloat(log.cost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="py-4 px-3 text-slate-400 font-mono">{log.service_date}</td>
                          <td className="py-4 px-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] uppercase tracking-wider font-extrabold border ${log.status === 'Active' ? 'bg-amber-955/20 border-amber-500/20 text-amber-500' : 'bg-emerald-950/20 border-emerald-500/20 text-emerald-450'}`}>
                              {log.status}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-right">
                            {log.status === 'Active' ? (
                              <button
                                onClick={() => handleCompleteService(log.id)}
                                className="px-2.5 py-1.5 bg-emerald-650 hover:bg-emerald-600 text-white font-bold rounded-lg text-[10px] tracking-wide transition-all shadow-sm"
                              >
                                Complete Service
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500 italic pr-2">Resolved</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="py-8 text-center text-slate-550 text-xs">
                          No maintenance sheets filed.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Maintenance;
