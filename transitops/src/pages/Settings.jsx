import React, { useState } from 'react';

const Settings = () => {
  const [depotName, setDepotName] = useState('Central Logistics Denver');
  const [currency, setCurrency] = useState('USD');
  const [distanceUnit, setDistanceUnit] = useState('km');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  // Role permissions static mapping matching the console mockup
  const matrix = [
    { page: 'Dashboard', manager: true, dispatcher: true, safety: true, financial: true },
    { page: 'Vehicle Registry', manager: true, dispatcher: true, safety: false, financial: false },
    { page: 'Drivers & Safety', manager: true, dispatcher: false, safety: true, financial: false },
    { page: 'Trip Dispatcher', manager: true, dispatcher: true, safety: false, financial: false },
    { page: 'Maintenance logs', manager: true, dispatcher: false, safety: true, financial: false },
    { page: 'Fuel & Expenses', manager: true, dispatcher: false, safety: false, financial: true },
    { page: 'Reports & Analytics', manager: true, dispatcher: false, safety: true, financial: true },
    { page: 'System Settings', manager: true, dispatcher: false, safety: false, financial: false },
  ];

  const renderCheck = (allowed) => {
    if (allowed) {
      return (
        <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
          ✓
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-950/40 border border-red-500/30 text-red-400 text-[10px] font-bold">
        ✕
      </span>
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight text-left">Configuration Settings</h2>
        <p className="text-xs text-slate-500 text-left">Control depot parameters and view Role-Based Access Control (RBAC) scopes</p>
      </div>

      {isSaved && (
        <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-350 rounded-2xl px-5 py-4 text-xs text-left flex gap-3 animate-pulse">
          <svg className="h-4 w-4 text-emerald-450 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span>Depot parameters updated successfully (demo profile cached).</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: General Settings Form (col-span-1) */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 shadow-md text-left space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Depot Parameter Controls</h3>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Primary Depot Station Name
                </label>
                <input
                  type="text"
                  required
                  value={depotName}
                  onChange={(e) => setDepotName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 text-slate-100 placeholder-slate-650 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Currency Symbol
                </label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="USD">USD ($) - US Dollar</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GBP">GBP (£) - British Pound</option>
                  <option value="CAD">CAD ($) - Canadian Dollar</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Distance Logs Metric Unit
                </label>
                <select
                  value={distanceUnit}
                  onChange={(e) => setDistanceUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="km">Kilometers (km)</option>
                  <option value="miles">Miles (mi)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs transition-all shadow-md mt-1"
              >
                Save Settings
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: RBAC Matrix Dashboard (col-span-2) */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 shadow-md text-left space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Role-Based Access Controls (RBAC) Matrix</h3>
              <p className="text-[11px] text-slate-500 mt-1">Platform access scopes per role-permission schemas</p>
            </div>

            <div className="overflow-x-auto pt-2">
              <table className="w-full text-none">
                <thead>
                  <tr className="border-b border-slate-992 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                    <th className="pb-3 px-3">System Module / Page</th>
                    <th className="pb-3 px-3 text-center">Fleet Manager</th>
                    <th className="pb-3 px-3 text-center">Dispatcher</th>
                    <th className="pb-3 px-3 text-center">Safety Officer</th>
                    <th className="pb-3 px-3 text-center">Financial Analyst</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/30 text-xs text-slate-350">
                  {matrix.map((row) => (
                    <tr key={row.page} className="hover:bg-slate-900/10">
                      <td className="py-4 px-3 font-semibold text-slate-205">{row.page}</td>
                      <td className="py-4 px-3 text-center">{renderCheck(row.manager)}</td>
                      <td className="py-4 px-3 text-center">{renderCheck(row.dispatcher)}</td>
                      <td className="py-4 px-3 text-center">{renderCheck(row.safety)}</td>
                      <td className="py-4 px-3 text-center">{renderCheck(row.financial)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default Settings;
