import React, { useState, useEffect } from 'react';
import axios from 'axios';

const VehicleRegistry = () => {
  const [vehicles, setVehicles] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [formData, setFormData] = useState({
    reg_no: '',
    name_model: '',
    type: '',
    max_capacity_kg: '',
    odometer: '',
    acquisition_cost: '',
    status: 'Available',
  });
  const [formError, setFormError] = useState('');

  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');

      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Build query string params
      const params = {};
      if (filters.search) params.search = filters.search.trim();
      if (filters.type) params.type = filters.type;
      if (filters.status) params.status = filters.status;

      const response = await axios.get('http://localhost:5000/api/vehicles', {
        headers: config.headers,
        params
      });

      setVehicles(response.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to sync details from vehicle registry.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.type, filters.status]); // Auto-fetch on dropdown change, search will use submit trigger or debounce

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVehicles();
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: '',
      status: '',
    });
    // Triggers refetch since states update
  };

  // Run initial or state filters change
  useEffect(() => {
    if (filters.search === '' && filters.type === '' && filters.status === '') {
      fetchVehicles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleOpenAddModal = () => {
    setModalMode('add');
    setSelectedVehicleId(null);
    setFormError('');
    setFormData({
      reg_no: '',
      name_model: '',
      type: '',
      max_capacity_kg: '',
      odometer: '0',
      acquisition_cost: '',
      status: 'Available',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (vehicle) => {
    setModalMode('edit');
    setSelectedVehicleId(vehicle.id);
    setFormError('');
    setFormData({
      reg_no: vehicle.reg_no,
      name_model: vehicle.name_model,
      type: vehicle.type,
      max_capacity_kg: vehicle.max_capacity_kg,
      odometer: vehicle.odometer,
      acquisition_cost: vehicle.acquisition_cost,
      status: vehicle.status,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Pre-validation
    if (!formData.reg_no.trim() || !formData.name_model.trim() || !formData.type.trim() ||
        formData.max_capacity_kg === '' || formData.acquisition_cost === '') {
      setFormError('Please fill out all required fields.');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      const payload = {
        reg_no: formData.reg_no.trim(),
        name_model: formData.name_model.trim(),
        type: formData.type.trim(),
        max_capacity_kg: parseFloat(formData.max_capacity_kg),
        odometer: parseFloat(formData.odometer) || 0,
        acquisition_cost: parseFloat(formData.acquisition_cost),
        status: formData.status,
      };

      if (modalMode === 'add') {
        await axios.post('http://localhost:5000/api/vehicles', payload, config);
      } else {
        await axios.put(`http://localhost:5000/api/vehicles/${selectedVehicleId}`, payload, config);
      }

      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setFormError(err.response.data.error);
      } else {
        setFormError('An unexpected server error occurred. Please verify your details.');
      }
    }
  };

  const handleRetireVehicle = async (id, modelName) => {
    if (!window.confirm(`Are you sure you want to retire ${modelName}? This changes its status to 'Retired'.`)) {
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      await axios.delete(`http://localhost:5000/api/vehicles/${id}`, config);
      fetchVehicles();
    } catch (err) {
      console.error(err);
      alert('Failed to retire vehicle.');
    }
  };

  // Helper mapping status badge style configs
  const getStatusBadge = (status) => {
    let badgeColor = 'bg-slate-800 border-slate-700 text-slate-300';
    if (status === 'Available') {
      badgeColor = 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400';
    } else if (status === 'On Trip') {
      badgeColor = 'bg-blue-950/40 border-blue-500/20 text-blue-400';
    } else if (status === 'In Shop') {
      badgeColor = 'bg-amber-950/40 border-amber-500/20 text-amber-400';
    } else if (status === 'Retired') {
      badgeColor = 'bg-red-950/40 border-red-500/20 text-red-400';
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold border ${badgeColor}`}>
        {status}
      </span>
    );
  };

  // Extract list of existing types for filters dropdown
  const uniqueTypes = ['Semi Truck', 'Box Truck', 'Van', 'Flatbed', 'Trailer', 'Pickup Truck'];

  return (
    <div className="space-y-8 font-sans">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight text-left">Vehicle Registry</h2>
          <p className="text-xs text-slate-500 text-left">View and manage fleet vehicles, registration identifiers, and statuses</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="button-primary-pill self-start md:self-auto"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Main Error Block */}
      {errorMsg && (
        <div className="bg-red-950/40 border border-red-500/20 text-red-300 rounded-2xl px-5 py-4 text-sm flex items-center justify-between shadow-lg">
          <div className="flex gap-3">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
          <button onClick={fetchVehicles} className="text-indigo-400 hover:text-indigo-300 font-semibold underline text-xs">Retry Refresh</button>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 shadow-md">
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow max-w-5xl">
            {/* Search Input */}
            <div>
              <label htmlFor="search" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 text-left">
                Vehicle Key
              </label>
              <div className="relative">
                <input
                  id="search"
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Search model or registration no"
                  className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-xl pl-9 pr-4 py-2.5 text-xs transition-all focus:outline-none focus:border-indigo-500/70"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-600">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.637 10.637Z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Type dropdown */}
            <div>
              <label htmlFor="type" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 text-left">
                Asset Type
              </label>
              <select
                id="type"
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/70"
              >
                <option value="">All Types</option>
                {uniqueTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            {/* Status dropdown */}
            <div>
              <label htmlFor="status" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-2 text-left">
                Registry Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-indigo-500/70"
              >
                <option value="">All Statuses</option>
                <option value="Available">Available</option>
                <option value="On Trip">On Trip</option>
                <option value="In Shop">In Shop</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleResetFilters}
              className="px-4 py-2.5 border border-slate-800 hover:border-slate-700 bg-slate-950/40 text-slate-350 font-medium rounded-xl text-xs transition-all hover:text-slate-100"
            >
              Reset
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white font-medium rounded-xl text-xs transition-all shadow-md shadow-indigo-650/10"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/40 backdrop-blur border border-slate-900 rounded-3xl p-6 shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <svg className="animate-spin h-7 w-7 text-indigo-505 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-slate-400 text-xs">Loading operational registry...</span>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-900 text-slate-500 text-[10px] font-semibold uppercase tracking-wider">
                  <th className="pb-3 px-4">Reg No</th>
                  <th className="pb-3 px-4">Name/Model</th>
                  <th className="pb-3 px-4">Type</th>
                  <th className="pb-3 px-4">Capacity</th>
                  <th className="pb-3 px-4">Odometer</th>
                  <th className="pb-3 px-4">Acq. Cost</th>
                  <th className="pb-3 px-4">Status</th>
                  <th className="pb-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900/30 text-xs">
                {vehicles.length > 0 ? (
                  vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="py-4 px-4 font-mono font-bold text-indigo-400">{v.reg_no}</td>
                      <td className="py-4 px-4 font-semibold text-slate-200">{v.name_model}</td>
                      <td className="py-4 px-4 text-slate-405">{v.type}</td>
                      <td className="py-4 px-4 text-slate-350">
                        {Number(v.max_capacity_kg).toLocaleString()} kg
                      </td>
                      <td className="py-4 px-4 text-slate-350">
                        {Number(v.odometer || 0).toLocaleString()} km
                      </td>
                      <td className="py-4 px-4 text-slate-300 font-medium">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v.acquisition_cost)}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(v.status)}
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(v)}
                          className="px-2.5 py-1.5 border border-slate-800 hover:border-slate-700 bg-slate-900/50 hover:bg-slate-800/60 text-slate-300 font-semibold rounded-lg text-[10px] tracking-wide transition-all"
                        >
                          Edit
                        </button>
                        {v.status !== 'Retired' && (
                          <button
                            onClick={() => handleRetireVehicle(v.id, v.name_model)}
                            className="px-2.5 py-1.5 border border-red-950/40 hover:border-red-900/40 bg-red-950/20 hover:bg-red-950/40 text-red-400 font-semibold rounded-lg text-[10px] tracking-wide transition-all"
                          >
                            Retire
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-slate-500 text-sm">
                      No vehicles found matching the filter query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-850 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl relative text-left">
            {/* Close Cross */}
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
                {modalMode === 'add' ? 'Register New Fleet Asset' : 'Edit Fleet Asset Details'}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Provide accurate vehicle operational metrics for scheduling.
              </p>
            </div>

            {/* ERROR LEFT-ACCENT ERROR BANNER */}
            {formError && (
              <div className="bg-red-950/30 border-l-4 border-red-500 text-red-200 p-4 rounded-r-xl text-xs font-semibold flex items-center justify-between shadow-lg my-3">
                <div className="aria-live flex items-center gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                  </svg>
                  <span>{formError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormError('')}
                  className="text-red-450 hover:text-red-200 transition-colors ml-2"
                >
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Registration Number */}
                <div className="col-span-1">
                  <label htmlFor="form-reg" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 text-left">
                    Registration No *
                  </label>
                  <input
                    id="form-reg"
                    type="text"
                    required
                    value={formData.reg_no}
                    disabled={modalMode === 'edit'} // Lock it to prevent breaking trip codes or just keep it editable? The prompt typical rules lock it or keep editable. Let's make it editable but locked if they are editing can be standard, or keep editable and validate. Let's make it editable and validate.
                    onChange={(e) => setFormData({ ...formData, reg_no: e.target.value })}
                    placeholder="e.g. TX-4401"
                    className="w-full bg-slate-950/80 border border-slate-805 text-slate-100 placeholder-slate-650 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70 disabled:opacity-50"
                  />
                </div>

                {/* Model Name */}
                <div className="col-span-1">
                  <label htmlFor="form-model" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 text-left">
                    Name / Model *
                  </label>
                  <input
                    id="form-model"
                    type="text"
                    required
                    value={formData.name_model}
                    onChange={(e) => setFormData({ ...formData, name_model: e.target.value })}
                    placeholder="e.g. Ford F-550"
                    className="w-full bg-slate-950/80 border border-slate-805 text-slate-100 placeholder-slate-650 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Type Selection */}
                <div className="col-span-1">
                  <label htmlFor="form-type-select" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 text-left">
                    Asset Type *
                  </label>
                  <select
                    id="form-type-select"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-slate-950/80 border border-slate-805 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                    required
                  >
                    <option value="">Select Type</option>
                    {uniqueTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Max Capacity (Weight) */}
                <div className="col-span-1">
                  <label htmlFor="form-capacity" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 text-left">
                    Max Capacity (kg) *
                  </label>
                  <input
                    id="form-capacity"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.max_capacity_kg}
                    onChange={(e) => setFormData({ ...formData, max_capacity_kg: e.target.value })}
                    placeholder="e.g. 8500"
                    className="w-full bg-slate-950/80 border border-slate-805 text-slate-100 placeholder-slate-650 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Odometer */}
                <div className="col-span-1">
                  <label htmlFor="form-odometer" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 text-left">
                    Odometer Reading (km)
                  </label>
                  <input
                    id="form-odometer"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.odometer}
                    onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                    placeholder="0"
                    className="w-full bg-slate-950/80 border border-slate-805 text-slate-100 placeholder-slate-650 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                  />
                </div>

                {/* Acquisition Cost */}
                <div className="col-span-1">
                  <label htmlFor="form-cost" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 text-left">
                    Acquisition Cost ($) *
                  </label>
                  <input
                    id="form-cost"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={formData.acquisition_cost}
                    onChange={(e) => setFormData({ ...formData, acquisition_cost: e.target.value })}
                    placeholder="e.g. 75000"
                    className="w-full bg-slate-950/80 border border-slate-805 text-slate-100 placeholder-slate-650 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
              </div>

              {/* Status Select */}
              <div>
                <label htmlFor="form-status" className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1 text-left">
                  Operational Status
                </label>
                <select
                  id="form-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-950/80 border border-slate-805 text-slate-100 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500/70"
                >
                  <option value="Available">Available</option>
                  <option value="On Trip">On Trip</option>
                  <option value="In Shop">In Shop</option>
                  <option value="Retired">Retired</option>
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
                  {modalMode === 'add' ? 'Register Asset' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleRegistry;
