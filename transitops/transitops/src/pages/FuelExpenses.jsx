import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FuelExpenses = () => {
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenseLogs, setExpenseLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Operational Cost Footer State
  const [selectedCostVehicle, setSelectedCostVehicle] = useState('');
  const [operationalCostData, setOperationalCostData] = useState(null);
  const [isCostLoading, setIsCostLoading] = useState(false);

  // Modals Visibility
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // Fuel Form State
  const [fuelForm, setFuelForm] = useState({
    vehicle_id: '',
    trip_id: '',
    liters: '',
    cost: '',
    log_date: new Date().toISOString().split('T')[0],
  });

  // Expense Form State
  const [expenseForm, setExpenseForm] = useState({
    vehicle_id: '',
    trip_id: '',
    toll: '',
    misc: '',
    expense_date: new Date().toISOString().split('T')[0],
  });

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const [fuelRes, expenseRes, vehiclesRes, tripsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/fuel-logs', config),
        axios.get('http://localhost:5000/api/expenses', config),
        axios.get('http://localhost:5000/api/vehicles', config),
        axios.get('http://localhost:5000/api/trips', config)
      ]);

      setFuelLogs(fuelRes.data);
      setExpenseLogs(expenseRes.data);
      setVehicles(vehiclesRes.data);
      setTrips(tripsRes.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to sync fuel and expense logs from registries.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFetchOperationalCost = async (vehicleId) => {
    setSelectedCostVehicle(vehicleId);
    if (!vehicleId) {
      setOperationalCostData(null);
      return;
    }

    try {
      setIsCostLoading(true);
      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const res = await axios.get(`http://localhost:5000/api/vehicles/${vehicleId}/operational-cost`, config);
      setOperationalCostData(res.data);
    } catch (err) {
      console.error(err);
      alert('Failed to retrieve vehicle operational cost aggregations.');
    } finally {
      setIsCostLoading(false);
    }
  };

  const handleLogFuelSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!fuelForm.vehicle_id || !fuelForm.liters || !fuelForm.cost || !fuelForm.log_date) {
      alert('Please fill out all required fields to log fuel.');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const payload = {
        vehicle_id: parseInt(fuelForm.vehicle_id),
        trip_id: fuelForm.trip_id ? parseInt(fuelForm.trip_id) : null,
        liters: parseFloat(fuelForm.liters),
        cost: parseFloat(fuelForm.cost),
        log_date: fuelForm.log_date,
      };

      await axios.post('http://localhost:5000/api/fuel-logs', payload, config);
      setSuccessMsg('Refueling event logged successfully!');
      setIsFuelModalOpen(false);
      
      // Reset
      setFuelForm({
        vehicle_id: '',
        trip_id: '',
        liters: '',
        cost: '',
        log_date: new Date().toISOString().split('T')[0],
      });

      fetchData();
      if (selectedCostVehicle) handleFetchOperationalCost(selectedCostVehicle);
    } catch (err) {
      console.error(err);
      alert('Server failed to log refueling.');
    }
  };

  const handleLogExpenseSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!expenseForm.vehicle_id || !expenseForm.expense_date) {
      alert('Please fill out all required fields.');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const payload = {
        vehicle_id: parseInt(expenseForm.vehicle_id),
        trip_id: expenseForm.trip_id ? parseInt(expenseForm.trip_id) : null,
        toll: expenseForm.toll ? parseFloat(expenseForm.toll) : 0,
        misc: expenseForm.misc ? parseFloat(expenseForm.misc) : 0,
        expense_date: expenseForm.expense_date,
      };

      await axios.post('http://localhost:5000/api/expenses', payload, config);
      setSuccessMsg('Expense logged successfully!');
      setIsExpenseModalOpen(false);

      // Reset
      setExpenseForm({
        vehicle_id: '',
        trip_id: '',
        toll: '',
        misc: '',
        expense_date: new Date().toISOString().split('T')[0],
      });

      fetchData();
      if (selectedCostVehicle) handleFetchOperationalCost(selectedCostVehicle);
    } catch (err) {
      console.error(err);
      alert('Server failed to log trip operating expense.');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight text-left">Fuel & Operating Expenses</h2>
          <p className="text-xs text-slate-500 text-left">Log fuel consumption rates, toll tariffs, utility items, and audit operating costs</p>
        </div>
        <div className="flex gap-3 self-start md:self-auto">
          <button
            onClick={() => setIsFuelModalOpen(true)}
            className="button-primary-pill bg-indigo-650 hover:bg-indigo-600"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Log Fuel</span>
          </button>
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800/80 text-slate-200 font-semibold rounded-full text-xs flex items-center gap-2 transition-all shadow-md"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-350 rounded-2xl px-5 py-4 text-xs flex gap-3 text-left">
          <svg className="h-4 w-4 text-emerald-450 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid of Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Fuel Consumption Logs Table */}
        <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 shadow-md overflow-hidden text-left">
          <h3 className="text-xs font-bold text-slate-405 uppercase tracking-wider mb-4">Fuel Refueling Registry</h3>
          <div className="overflow-x-auto">
            {isLoading && fuelLogs.length === 0 ? (
              <span className="text-xs text-slate-400">Syncing logs...</span>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-992 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                    <th className="pb-3 px-3">Vehicle</th>
                    <th className="pb-3 px-3">Trip</th>
                    <th className="pb-3 px-3 text-right">Liters</th>
                    <th className="pb-3 px-3 text-right">Cost</th>
                    <th className="pb-3 px-3">Log Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/30 text-xs text-slate-300">
                  {fuelLogs.map((f) => (
                    <tr key={f.id} className="hover:bg-slate-900/10">
                      <td className="py-4 px-3 font-semibold text-slate-205">{f.reg_no}</td>
                      <td className="py-4 px-3 font-mono font-bold text-slate-450">{f.trip_code || '—'}</td>
                      <td className="py-4 px-3 text-right font-mono">{parseFloat(f.liters).toLocaleString()} L</td>
                      <td className="py-4 px-3 text-right font-mono text-slate-250">${parseFloat(f.cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-4 px-3 font-mono text-slate-450">{f.log_date}</td>
                    </tr>
                  ))}
                  {fuelLogs.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-slate-500">No fuel entries logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Operating Expenses Table */}
        <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 shadow-md overflow-hidden text-left">
          <h3 className="text-xs font-bold text-slate-405 uppercase tracking-wider mb-4">Trip Expenses (Tolls & Misc)</h3>
          <div className="overflow-x-auto">
            {isLoading && expenseLogs.length === 0 ? (
              <span className="text-xs text-slate-400">Syncing logs...</span>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-992 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                    <th className="pb-3 px-3">Vehicle</th>
                    <th className="pb-3 px-3">Trip</th>
                    <th className="pb-3 px-3 text-right">Tolls</th>
                    <th className="pb-3 px-3 text-right">Misc</th>
                    <th className="pb-3 px-3">Expense Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/30 text-xs text-slate-300">
                  {expenseLogs.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-900/10">
                      <td className="py-4 px-3 font-semibold text-slate-205">{e.reg_no}</td>
                      <td className="py-4 px-3 font-mono font-bold text-slate-450">{e.trip_code || '—'}</td>
                      <td className="py-4 px-3 text-right font-mono">${parseFloat(e.toll).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-4 px-3 text-right font-mono">${parseFloat(e.misc).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-4 px-3 font-mono text-slate-450">{e.expense_date}</td>
                    </tr>
                  ))}
                  {expenseLogs.length === 0 && (
                    <tr>
                      <td colSpan="5" className="py-6 text-center text-slate-500">No expenses logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

      {/* FOOTER ROW: Total Operational Cost Summary bar */}
      <div className="border border-indigo-500/20 bg-indigo-950/10 rounded-2xl p-6 text-left flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md max-w-7xl">
        <div className="space-y-1.5 max-w-lg">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-indigo-400 block">Operating Costs Aggregator</span>
          <p className="text-xs text-slate-400 leading-relaxed">
            Query total accumulated cost records across fuel logs and maintenance logs for specific active vehicles.
          </p>
          <div className="pt-2 flex items-center gap-3">
            <label className="text-[10.5px] font-semibold text-slate-400">Select Vehicle:</label>
            <select
              value={selectedCostVehicle}
              onChange={(e) => handleFetchOperationalCost(e.target.value)}
              className="bg-slate-950 border border-slate-850 text-slate-200 rounded-lg px-2 py-1 text-xs focus:outline-none"
            >
              <option value="">Choose asset...</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.reg_no} ({v.name_model})</option>
              ))}
            </select>
          </div>
        </div>

        {/* Numerical Costs Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-4 bg-slate-950/40 border border-slate-900 rounded-xl flex-grow max-w-2xl">
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Fuel Cost Sum</span>
            <span className="text-base font-extrabold text-white mt-0.5 font-mono">
              ${operationalCostData ? parseFloat(operationalCostData.fuel_cost).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Maintenance Sum</span>
            <span className="text-base font-extrabold text-white mt-0.5 font-mono">
              ${operationalCostData ? parseFloat(operationalCostData.maintenance_cost).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Tolls / Misc Sum</span>
            <span className="text-base font-extrabold text-white mt-0.5 font-mono">
              ${operationalCostData ? parseFloat(operationalCostData.other_expense_cost).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
          <div className="flex flex-col border-l border-slate-850 pl-4">
            <span className="text-[9px] uppercase font-bold text-indigo-400 tracking-wider">Total Operational Cost</span>
            <span className="text-lg font-black text-indigo-305 mt-0.5 font-mono">
              ${operationalCostData ? parseFloat(operationalCostData.total_operational_cost).toLocaleString(undefined, { minimumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
        </div>
      </div>

      {/* Fuel dialog modal */}
      {isFuelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative text-left">
            <button
              onClick={() => setIsFuelModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Refueling Entry Log</h3>
              <p className="text-[11px] text-slate-500 mt-1">Submit liters refueled and exact billing cost details.</p>
            </div>

            <form onSubmit={handleLogFuelSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Vehicle *</label>
                  <select
                    required
                    value={fuelForm.vehicle_id}
                    onChange={(e) => setFuelForm({ ...fuelForm, vehicle_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.reg_no}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Assigned Trip (Optional)</label>
                  <select
                    value={fuelForm.trip_id}
                    onChange={(e) => setFuelForm({ ...fuelForm, trip_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="">Select trip code...</option>
                    {trips.map(t => (
                      <option key={t.id} value={t.id}>{t.trip_code}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Liters Refueled *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 50"
                    value={fuelForm.liters}
                    onChange={(e) => setFuelForm({ ...fuelForm, liters: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 text-slate-101 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Receipt Cost ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 100.00"
                    value={fuelForm.cost}
                    onChange={(e) => setFuelForm({ ...fuelForm, cost: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 text-slate-101 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Refuel Date *</label>
                <input
                  type="date"
                  required
                  value={fuelForm.log_date}
                  onChange={(e) => setFuelForm({ ...fuelForm, log_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 text-slate-101 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFuelModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 bg-slate-950/45 text-slate-350 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs"
                >
                  Create Fuel Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense dialog modal */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl relative text-left">
            <button
              onClick={() => setIsExpenseModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div>
              <h3 className="text-base font-bold text-white tracking-wide">Expense Record Log</h3>
              <p className="text-[11px] text-slate-500 mt-1">Submit toll charges and miscellaneous expenses.</p>
            </div>

            <form onSubmit={handleLogExpenseSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Vehicle *</label>
                  <select
                    required
                    value={expenseForm.vehicle_id}
                    onChange={(e) => setExpenseForm({ ...expenseForm, vehicle_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="">Select vehicle...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>{v.reg_no}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Assigned Trip (Optional)</label>
                  <select
                    value={expenseForm.trip_id}
                    onChange={(e) => setExpenseForm({ ...expenseForm, trip_id: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  >
                    <option value="">Select trip code...</option>
                    {trips.map(t => (
                      <option key={t.id} value={t.id}>{t.trip_code}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Toll Fees ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expenseForm.toll}
                    onChange={(e) => setExpenseForm({ ...expenseForm, toll: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 text-slate-101 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Miscellaneous ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expenseForm.misc}
                    onChange={(e) => setExpenseForm({ ...expenseForm, misc: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 text-slate-101 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Expense Date *</label>
                <input
                  type="date"
                  required
                  value={expenseForm.expense_date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 text-slate-101 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 bg-slate-950/45 text-slate-350 rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-bold rounded-xl text-xs"
                >
                  Create Expense Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default FuelExpenses;
