import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Analytics = () => {
  const [summary, setSummary] = useState(null);
  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [costlyVehicles, setCostlyVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const [summaryRes, monthlyRes, costlyRes] = await Promise.all([
        axios.get('http://localhost:5000/api/analytics/summary', config),
        axios.get('http://localhost:5000/api/analytics/monthly-revenue', config),
        axios.get('http://localhost:5000/api/analytics/top-costly-vehicles', config)
      ]);

      setSummary(summaryRes.data);
      setMonthlyRevenue(monthlyRes.data);
      setCostlyVehicles(costlyRes.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to synchronize dynamic analytics reporting from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Client-Side CSV Export Builder
  const handleExportCSV = () => {
    if (!summary || costlyVehicles.length === 0) {
      alert('Analytics summary data has not synchronized yet.');
      return;
    }

    const { details } = summary;
    
    // Prepare contents
    const rows = [
      ['TransitOps Operational Analytics Statement'],
      ['Generated Date', new Date().toISOString().split('T')[0]],
      [''],
      ['--- OVERALL PERFORMANCE METRICS ---'],
      ['Metric', 'Value'],
      ['Fuel Efficiency (km/L)', summary.fuel_efficiency_km_l],
      ['Fleet Utilization (%)', summary.fleet_utilization_pct],
      ['Total Operational Cost (USD)', summary.total_operational_cost],
      ['Fleet Est. ROI (%)', summary.fleet_roi_pct],
      ['Total Distance Traveled (km)', details.total_distance_km],
      ['Total Fuel Consumed (L)', details.total_fuel_liters],
      ['Total Est. Revenue (USD)', details.total_revenue_usd],
      ['Total Fuel Cost (USD)', details.total_fuel_cost_usd],
      ['Total Maintenance Cost (USD)', details.total_maintenance_cost_usd],
      ['Total Acquisition Cost (USD)', details.total_acquisition_cost_usd],
      [''],
      ['--- TOP COSTLY FLEET VEHICLES ---'],
      ['Reg No', 'Model', 'Fuel Cost (USD)', 'Maintenance (USD)', 'Tolls/Misc (USD)', 'Total (USD)']
    ];

    costlyVehicles.forEach(v => {
      rows.push([
        v.reg_no,
        v.name_model,
        v.fuel_cost.toFixed(2),
        v.maintenance_cost.toFixed(2),
        v.other_expense_cost.toFixed(2),
        v.total_cost.toFixed(2)
      ]);
    });

    // Convert array structure into CSV format
    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `TransitOps_Analytics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight text-left">Reports & Fleet Analytics</h2>
          <p className="text-xs text-slate-500 text-left">Audit fuel consumption metrics, ROI valuations, and export operational statistics</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="button-primary-pill bg-indigo-650 hover:bg-indigo-600 self-start md:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>Export Analytics CSV</span>
        </button>
      </div>

      {errorMsg && (
        <div className="bg-red-950/40 border border-red-500/20 text-red-300 rounded-2xl px-5 py-4 text-xs">
          {errorMsg}
        </div>
      )}

      {/* KPI Cards (4 grid items) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
        {/* Card 1: Fuel Efficiency */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest block">Fuel Efficiency</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-white font-mono">
              {summary ? summary.fuel_efficiency_km_l : '—'}
            </span>
            <span className="text-[10px] text-slate-400 font-semibold">km / Liter</span>
          </div>
          <p className="text-[9.5px] text-slate-550 mt-1">Sum of completed dispatch travel / liter consumption</p>
        </div>

        {/* Card 2: Fleet Utilization */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest block">Fleet Utilization</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-indigo-400 font-mono">
              {summary ? summary.fleet_utilization_pct : '—'}
            </span>
            <span className="text-[10px] text-indigo-500 font-extrabold">%</span>
          </div>
          <p className="text-[9.5px] text-slate-550 mt-1">Percentage of non-retired vehicles on trip right now</p>
        </div>

        {/* Card 3: Operational Cost */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest block">Fleet Operating Costs</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className="text-2xl font-black text-rose-500 font-mono">
              ${summary ? summary.total_operational_cost.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'}
            </span>
            <span className="text-[10px] text-rose-600 font-medium">USD</span>
          </div>
          <p className="text-[9.5px] text-slate-550 mt-1">Total aggregated fuel logs + completed maintenance fees</p>
        </div>

        {/* Card 4: Fleet ROI */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 shadow-sm">
          <span className="text-[10px] font-bold text-slate-550 uppercase tracking-widest block">Fleet ROI Estimate</span>
          <div className="flex items-baseline gap-1 mt-2">
            <span className={`text-2xl font-black font-mono ${summary && parseFloat(summary.fleet_roi_pct) >= 0 ? 'text-emerald-400' : 'text-rose-405'}`}>
              {summary ? summary.fleet_roi_pct : '—'}
            </span>
            <span className={`text-[10px] font-bold ${summary && parseFloat(summary.fleet_roi_pct) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>%</span>
          </div>
          <p className="text-[9.5px] text-slate-550 mt-1">Estimate metric calculated from flat km rate against purchases</p>
        </div>
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Monthly Revenue Bar Chart (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 shadow-md text-left flex flex-col justify-between min-h-[360px]">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Logistics Revenue</h3>
            <p className="text-[11px] text-slate-500 mb-4">Flat valuation of $2.50 / km generated on completed routes</p>
          </div>

          <div className="h-64 w-full">
            {monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#121824" vertical={false} />
                  <XAxis dataKey="month" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px' }}
                    labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                    itemStyle={{ color: '#6366f1', fontSize: '11px' }}
                  />
                  <Bar dataKey="revenue" name="Revenue ($)" fill="#6366f1" radius={[6, 6, 0, 0]} maxBarSize={45} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-600 text-xs">
                No monthly data logs found in completed logs.
              </div>
            )}
          </div>
        </div>

        {/* Costliest vehicles (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-slate-900/40 border border-slate-900 rounded-3xl p-6 shadow-md text-left flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Costliest Fleet Assets</h3>
            <p className="text-[11px] text-slate-500 mb-4">Highest cumulative operating costs (Refuels, Shop, Tolls)</p>
          </div>

          <div className="space-y-4 flex-grow pt-2">
            {costlyVehicles.map((v, i) => {
              // Calculate a visual progress percentage based on the highest cost
              const maxCost = costlyVehicles[0] ? costlyVehicles[0].total_cost : 1;
              const barHeightPct = Math.max(10, Math.round((v.total_cost / maxCost) * 100));

              return (
                <div key={v.id} className="space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-205">{v.reg_no} <span className="text-[10px] text-slate-550 font-normal">({v.name_model})</span></span>
                    <span className="font-mono text-slate-350">${v.total_cost.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                  </div>
                  {/* Progress loading bar */}
                  <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-900">
                    <div
                      className="bg-indigo-650 h-full rounded-full transition-all duration-500"
                      style={{ width: `${barHeightPct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] text-slate-550 font-mono">
                    <span>Shop: ${v.maintenance_cost.toLocaleString()}</span>
                    <span>Fuel: ${v.fuel_cost.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}

            {costlyVehicles.length === 0 && (
              <span className="text-xs text-slate-550 italic block pt-8 text-center">No cost records compiled.</span>
            )}
          </div>
        </div>

      </div>

      {/* Assumptions and Safety Note box */}
      <div className="p-5 bg-slate-900/20 border border-slate-900 rounded-2xl text-left">
        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Documentation & Reporting Assumptions</h4>
        <p className="text-[10.5px] leading-relaxed text-slate-500">
          Trip revenues are estimated using a standard industry flat rate of **$2.50 USD per kilometer** scaled over the planned travel log distance of active completed routes. Fleet ROIs compute net operating margins (Estimated Revenue minus refuels and shop costs) against the registered capital acquisition cost of active assets.
        </p>
      </div>

    </div>
  );
};

export default Analytics;
