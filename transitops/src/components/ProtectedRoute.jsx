import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) {
    // Redirect to login if not logged in
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Render custom 403 Forbidden screen
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 p-6">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-red-500/30 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl relative overflow-hidden">
          {/* Accent light glow */}
          <div className="absolute -top-12 -left-12 w-32 h-32 bg-red-600/10 rounded-full blur-2xl pointer-events-none"></div>
          <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none"></div>

          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-950/50 border border-red-500/20 text-red-400 rounded-2xl mb-6 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
            </svg>
          </div>

          <h2 className="text-3xl font-extrabold text-white tracking-tight mb-2">Access Restriced</h2>
          <p className="text-slate-400 text-sm mb-6 leading-relaxed">
            Your account role <strong>({user.role})</strong> does not have permission to view this resource. 
            Required department: <span className="text-slate-200 font-semibold">{allowedRoles.join(', ')}</span>.
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => window.history.back()}
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 hover:border-slate-600 font-medium rounded-xl text-sm transition-all"
            >
              Go Back
            </button>
            <a
              href="/login"
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25"
            >
              Change Seat
            </a>
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
