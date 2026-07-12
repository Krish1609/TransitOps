import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Drivers = () => {
  const [drivers, setDrivers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Totals calculations
  const [totals, setTotals] = useState({
    total: 0,
    Available: 0,
    'On Trip': 0,
    'Off Duty': 0,
    Suspended: 0,
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    license_no: '',
    license_category: 'Class A',
    license_expiry: '',
    contact_no: '',
    safety_score: '100',
    status: 'Available',
  });
  const [formError, setFormError] = useState('');

  const fetchDrivers = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');

      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const response = await axios.get('http://localhost:5000/api/drivers', config);
      setDrivers(response.data);

      // Compute status counts
      const counts = { total: response.data.length, Available: 0, 'On Trip': 0, 'Off Duty': 0, Suspended: 0 };
      response.data.forEach((d) => {
        if (counts[d.status] !== undefined) {
          counts[d.status]++;
        }
      });
      setTotals(counts);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to sync details from driver registry server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleOpenAddModal = () => {
    setModalMode('add');
    setSelectedDriverId(null);
    setFormError('');
    setFormData({
      name: '',
      license_no: '',
      license_category: 'Class A',
      license_expiry: '',
      contact_no: '',
      safety_score: '100',
      status: 'Available',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (driver) => {
    setModalMode('edit');
    setSelectedDriverId(driver.id);
    setFormError('');
    setFormData({
      name: driver.name,
      license_no: driver.license_no,
      license_category: driver.license_category || 'Class A',
      license_expiry: driver.license_expiry,
      contact_no: driver.contact_no || '',
      safety_score: String(driver.safety_score),
      status: driver.status,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim() || !formData.license_no.trim() || !formData.license_expiry) {
      setFormError('Please fill out all required fields.');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const payload = {
        name: formData.name.trim(),
        license_no: formData.license_no.trim(),
        license_category: formData.license_category,
        license_expiry: formData.license_expiry,
        contact_no: formData.contact_no.trim(),
        safety_score: parseFloat(formData.safety_score) || 100,
        status: formData.status,
      };

      if (modalMode === 'add') {
        await axios.post('http://localhost:5000/api/drivers', payload, config);
      } else {
        await axios.put(`http://localhost:5000/api/drivers/${selectedDriverId}`, payload, config);
      }

      setIsModalOpen(false);
      fetchDrivers();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setFormError(err.response.data.error);
      } else {
        setFormError('An unexpected server error occurred. Please verify your details.');
      }
    }
  };

  const handleDeleteDriver = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete driver ${name}? This action is permanent.`)) {
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.delete(`http://localhost:5000/api/drivers/${id}`, config);
      fetchDrivers();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        alert(err.response.data.error);
      } else {
        alert('Failed to delete driver.');
      }
    }
  };

  const getStatusBadge = (status) => {
    let badgeColor = 'bg-slate-800 border-slate-700 text-slate-350';
    if (status === 'Available') {
      badgeColor = 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400';
    } else if (status === 'On Trip') {
      badgeColor = 'bg-blue-950/40 border-blue-500/20 text-blue-400';
    } else if (status === 'Off Duty') {
      badgeColor = 'bg-slate-800/80 border-slate-700 text-slate-400';
    } else if (status === 'Suspended') {
      badgeColor = 'bg-red-950/40 border-red-500/20 text-red-450';
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${badgeColor}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight text-left">Drivers & Safety</h2>
          <p className="text-xs text-slate-500 text-left">Audit driver compliance profiles, safety scores, and commercial credentials</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="button-primary-pill self-start md:self-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Add Driver</span>
        </button>
      </div>

      {/* Main Error */}
      {errorMsg && (
        <div className="bg-red-950/40 border border-red-500/20 text-red-300 rounded-2xl px-5 py-4 text-sm flex items-center justify-between shadow-lg">
          <div className="flex gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
          <button onClick={fetchDrivers} className="text-indigo-400 hover:text-indigo-305 font-semibold underline text-xs">Retry</button>
        </div>
      )}

      {/* Totals Count Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total card */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Registered Officers</span>
          <span className="text-2xl font-extrabold text-white mt-1">{totals.total}</span>
        </div>
        {/* Available card */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Ready / Available</span>
          <span className="text-2xl font-extrabold text-emerald-400 mt-1">{totals.Available}</span>
        </div>
        {/* On Trip card */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Dispatches</span>
          <span className="text-2xl font-extrabold text-blue-400 mt-1">{totals['On Trip']}</span>
        </div>
        {/* Off Duty card */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between shadow-md">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Off Duty</span>
          <span className="text-2xl font-extrabold text-slate-400 mt-1">{totals['Off Duty']}</span>
        </div>
        {/* Suspended card */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between col-span-2 md:col-span-1 shadow-md">
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Suspended / Restricted</span>
          <span className="text-2xl font-extrabold text-red-400 mt-1">{totals.Suspended}</span>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="animate-spin h-7 w-7 text-indigo-500 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-slate-400 text-xs">Syncing safety register...</span>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-992 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                  <th className="pb-3 px-4">Driver</th>
                  <th className="pb-3 px-4">License No</th>
                  <th className="pb-3 px-4">Category</th>
                  <th className="pb-3 px-4">Expiry</th>
                  <th className="pb-3 px-4">Contact</th>
                  <th className="pb-3 px-4 text-center">Trip Compl. %</th>
                  <th className="pb-3 px-4 text-center">Safety Score</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/30 text-xs">
                {drivers.length > 0 ? (
                  drivers.map((d) => {
                    const expiryText = d.license_expiry;
                    
                    // Conditionally override row background values on license expiration states
                    const expiredRowClass = d.license_expired
                      ? 'bg-red-500/5 hover:bg-red-500/10 border-l-2 border-l-red-500 transition-colors'
                      : 'hover:bg-slate-900/10 transition-colors';

                    return (
                      <tr key={d.id} className={expiredRowClass}>
                        <td className="py-4 px-4 font-semibold text-slate-200">
                          <div>{d.name}</div>
                          {d.license_expired && (
                            <span className="inline-block mt-0.5 text-[9px] uppercase tracking-wider font-bold text-red-400 bg-red-950/50 border border-red-500/10 px-1.5 py-0.25 rounded-md">
                              Expired License
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 font-mono text-slate-350">{d.license_no}</td>
                        <td className="py-4 px-4 text-slate-400">{d.license_category || 'N/A'}</td>
                        <td className="py-4 px-4">
                          <span className={d.license_expired ? 'text-red-400 font-semibold' : 'text-slate-350'}>
                            {expiryText}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-400 font-mono">{d.contact_no || '—'}</td>
                        <td className="py-4 px-4 text-center font-mono font-medium text-slate-300">
                          {d.trip_completion_pct}%
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`font-mono font-bold ${d.safety_score >= 90 ? 'text-emerald-400' : d.safety_score >= 75 ? 'text-amber-400' : 'text-red-450'}`}>
                            {d.safety_score}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(d.status)}
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleOpenEditModal(d)}
                            className="px-2.5 py-1.5 border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-800/60 text-slate-300 font-semibold rounded-lg text-[10px] tracking-wide transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDriver(d.id, d.name)}
                            disabled={d.status === 'On Trip'}
                            className="px-2.5 py-1.5 border border-red-950/40 hover:border-red-900/40 bg-red-950/20 hover:bg-red-950/40 text-red-400 font-semibold rounded-lg text-[10px] tracking-wide transition-all disabled:opacity-30 disabled:hover:bg-red-950/20 disabled:cursor-not-allowed"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-500 text-sm">
                      No driver logs found matching filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Mock Rule Note shown at bottom */}
      <div className="border border-amber-500/20 bg-amber-950/10 rounded-2xl p-4 text-left flex items-start gap-3.5 shadow-sm max-w-4xl">
        <div className="mt-0.5 p-1 rounded-lg bg-amber-900/10 border border-amber-505/20 text-amber-450">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <div>
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400 block mb-1">Dispatch Safety Protocol Policy</span>
          <p className="text-xs text-amber-300/80 leading-relaxed max-w-3xl">
            In compliance with state safety directives, drivers with a **Suspended** operational registry status or an **Expired** commercial driver license (CDL) are automatically excluded from the scheduling dispatcher queue until their records have been validated as active.
          </p>
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative text-left">
            {/* Close */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div>
              <h3 className="text-base font-bold text-white tracking-wide">
                {modalMode === 'add' ? 'Register Private Driver Profile' : 'Edit Driver Registry File'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Provide compliant certifications to ensure trip eligibility.
              </p>
            </div>

            {/* Error banner left-accent pattern */}
            {formError && (
              <div className="bg-red-950/30 border-l-4 border-red-500 text-red-200 p-4 rounded-r-xl text-xs font-semibold flex items-center justify-between shadow-lg my-3 animate-fade-in">
                <div className="flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                  </svg>
                  <span>{formError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormError('')}
                  className="text-red-450 hover:text-red-250 transition-colors ml-2"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-1">
                  <label htmlFor="name-input" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 text-left">
                    Officer / Name *
                  </label>
                  <input
                    id="name-input"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-950/80 border border-slate-805 text-slate-100 placeholder-slate-650 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                  />
                </div>

                {/* License No */}
                <div className="col-span-1">
                  <label htmlFor="license-input" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 text-left">
                    License Number *
                  </label>
                  <input
                    id="license-input"
                    type="text"
                    required
                    value={formData.license_no}
                    onChange={(e) => setFormData({ ...formData, license_no: e.target.value })}
                    placeholder="e.g. DL-99201"
                    className="w-full bg-slate-950/80 border border-slate-805 text-slate-100 placeholder-slate-650 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Category select */}
                <div className="col-span-1">
                  <label htmlFor="role-select" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 text-left">
                    License Category *
                  </label>
                  <select
                    id="role-select"
                    value={formData.license_category}
                    onChange={(e) => setFormData({ ...formData, license_category: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-805 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                  >
                    <option value="Class A">Class A</option>
                    <option value="Class B">Class B</option>
                    <option value="Class C">Class C</option>
                  </select>
                </div>

                {/* Expiry Date input */}
                <div className="col-span-1">
                  <label htmlFor="expiry-input" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 text-left">
                    license Expiration *
                  </label>
                  <input
                    id="expiry-input"
                    type="date"
                    required
                    value={formData.license_expiry}
                    onChange={(e) => setFormData({ ...formData, license_expiry: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-805 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Contact */}
                <div className="col-span-1">
                  <label htmlFor="contact-input" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 text-left">
                    Contact No
                  </label>
                  <input
                    id="contact-input"
                    type="text"
                    value={formData.contact_no}
                    onChange={(e) => setFormData({ ...formData, contact_no: e.target.value })}
                    placeholder="e.g. +1-555-0101"
                    className="w-full bg-slate-950/80 border border-slate-805 text-slate-100 placeholder-slate-650 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                  />
                </div>

                {/* Safety Score */}
                <div className="col-span-1">
                  <label htmlFor="safety-input" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 text-left">
                    Safety Score (0–100)
                  </label>
                  <input
                    id="safety-input"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={formData.safety_score}
                    onChange={(e) => setFormData({ ...formData, safety_score: e.target.value })}
                    placeholder="100.00"
                    className="w-full bg-slate-950/80 border border-slate-805 text-slate-100 placeholder-slate-650 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 text-left">
                  Operational Status Code
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-805 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                >
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="Off Duty">Off Duty</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-800 bg-slate-950/40 hover:border-slate-700 text-slate-350 hover:text-slate-150 font-medium rounded-xl text-xs transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-650 hover:bg-indigo-600 text-white font-medium rounded-xl text-xs transition-all shadow-md shadow-indigo-650/10"
                >
                  {modalMode === 'add' ? 'Register Profile' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drivers;
