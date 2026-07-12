import React from 'react';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-650/20 border border-indigo-500/30 flex items-center justify-center text-indigo-455 font-bold text-sm">
            TO
          </div>
          <span className="font-bold text-lg tracking-tight text-white">TransitOps Command Center</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-950/70 border border-indigo-550/30 text-indigo-300 font-medium">
            {user?.role}
          </span>
          <span className="text-xs text-slate-400">{user?.name} ({user?.email})</span>
          <button
            onClick={logout}
            className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/60 border border-slate-700 hover:border-slate-600 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 p-8 max-w-6xl mx-auto w-full">
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-2">Welcome Back, {user?.name ? user.name.split(' ')[0] : 'Operator'}!</h2>
          <p className="text-slate-400 text-sm">
            Select a workspace widget below or run operational actions according to your role privileges.
          </p>
        </div>

        {/* Dynamic RBAC section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Role Specific details */}
          <div className="bg-slate-900/25 border border-slate-800/60 rounded-2xl p-6 relative overflow-hidden">
            <h3 className="text-lg font-bold text-white mb-3">Your Role Privileges</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              As a <strong className="text-indigo-400 font-semibold">{user?.role}</strong>, you have access to specialized controls:
            </p>
            <ul className="space-y-2 text-xs text-slate-350">
              {user?.role === 'Fleet Manager' && (
                <>
                  <li className="flex items-center gap-2">🟢 Manage and acquire vehicles</li>
                  <li className="flex items-center gap-2">🟢 Review maintenance scheduling logs</li>
                  <li className="flex items-center gap-2">🟢 Access system logs and telemetry settings</li>
                </>
              )}
              {user?.role === 'Dispatcher' && (
                <>
                  <li className="flex items-center gap-2">🟢 Dispatch ongoing trips</li>
                  <li className="flex items-center gap-2">🟢 Register driver schedules</li>
                  <li className="flex items-center gap-2">🟢 Live map command routing</li>
                </>
              )}
              {user?.role === 'Safety Officer' && (
                <>
                  <li className="flex items-center gap-2">🟢 License audits and safety ratings</li>
                  <li className="flex items-center gap-2">🟢 Investigate fuel discrepancies</li>
                  <li className="flex items-center gap-2">🟢 Incident reporting logs</li>
                </>
              )}
              {user?.role === 'Financial Analyst' && (
                <>
                  <li className="flex items-center gap-2">🟢 Toll & Toll Road expense charts</li>
                  <li className="flex items-center gap-2">🟢 Fuel cost audits</li>
                  <li className="flex items-center gap-2">🟢 Margin estimation dashboard</li>
                </>
              )}
            </ul>
          </div>

          {/* Card 2: Quick stats */}
          <div className="bg-slate-900/25 border border-slate-800/60 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-3">Live System Status</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Registered Drivers</span>
                  <span className="font-semibold text-slate-200">12 Available</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 w-4/5 h-full"></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Vehicles on Trip</span>
                  <span className="font-semibold text-slate-200">4 Active</span>
                </div>
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-500 w-1/3 h-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
