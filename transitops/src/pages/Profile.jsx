import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Name field cannot be empty');
      return;
    }

    if (newPassword || currentPassword) {
      if (!currentPassword) {
        setErrorMsg('Provide current password to configure a new one.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setErrorMsg('New passwords do not match');
        return;
      }
      if (newPassword.length < 6) {
        setErrorMsg('New password must match at least 6 characters');
        return;
      }
    }

    setIsLoading(true);
    try {
      const response = await axios.put('http://localhost:5000/api/auth/profile', {
        name: name.trim(),
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined
      });

      updateUser(response.data.user);
      setSuccessMsg(response.data.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg('Failed to update profile settings.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Fleet Manager': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'Dispatcher': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'Safety Officer': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      default: return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col gap-1 text-left">
          <h1 className="text-3xl font-bold tracking-tight text-white">Console Profile Settings</h1>
          <p className="text-slate-400 text-sm">Review credentials and customize authentication controls</p>
        </div>

        {/* Messaging alerts */}
        {errorMsg && (
          <div className="bg-red-950/45 border border-red-500/20 text-red-300 rounded-xl px-4 py-3 text-sm flex gap-3 animate-pulse text-left">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/45 border border-emerald-500/20 text-emerald-300 rounded-xl px-4 py-3 text-sm flex gap-3 text-left">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            <span>{successMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Summary Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-xl space-y-4">
            <div className="w-20 h-20 bg-indigo-650/10 border border-indigo-500/30 rounded-2xl flex items-center justify-center text-indigo-400 text-3xl font-black">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'TO'}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user?.name}</h2>
              <p className="text-slate-400 text-sm mt-0.5">{user?.email}</p>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getRoleColor(user?.role)}`}>
              {user?.role || 'Operator'}
            </span>
            <div className="w-full border-t border-slate-850 pt-4 text-xs text-slate-500">
              System ID: <code className="text-slate-400">{user?.id || 'N/A'}</code>
            </div>
          </div>

          {/* Settings Update Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:col-span-2 shadow-xl">
            <h3 className="text-lg font-bold text-white mb-4 text-left">Update profile credentials</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-left">
              
              <div>
                <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2" htmlFor="prof-name">
                  Full operator name
                </label>
                <input
                  id="prof-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-650 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:border-indigo-500/70"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2" htmlFor="prof-email">
                  System email address (Locked)
                </label>
                <input
                  id="prof-email"
                  type="email"
                  disabled
                  value={user?.email || ''}
                  className="w-full bg-slate-950/65 border border-slate-850 text-slate-500 rounded-xl px-4 py-2.5 text-sm cursor-not-allowed"
                />
              </div>

              <div className="border-t border-slate-850 my-6 pt-4">
                <h4 className="text-sm font-bold text-white mb-3">Re-key Security Pin (Optional)</h4>
                <p className="text-slate-400 text-xs mb-4">Complete all fields below key change only if reprogramming security password access.</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2" htmlFor="oldpwd">
                      Current Console Password
                    </label>
                    <input
                      id="oldpwd"
                      type="password"
                      placeholder="••••••••••••"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-700 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:border-indigo-500/70"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2" htmlFor="newpwd">
                        New Security Password
                      </label>
                      <input
                        id="newpwd"
                        type="password"
                        placeholder="••••••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-700 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:border-indigo-500/70"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2" htmlFor="confpwd">
                        Confirm Security Password
                      </label>
                      <input
                        id="confpwd"
                        type="password"
                        placeholder="••••••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-700 rounded-xl px-4 py-2.5 text-sm transition-all focus:outline-none focus:border-indigo-500/70"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-850 disabled:text-indigo-250 text-white font-medium rounded-xl px-6 py-2.5 text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-650/15"
                >
                  {isLoading ? 'Updating Settings...' : 'Save Configuration Changes'}
                </button>
              </div>

            </form>
          </div>

        </div>

      </div>
    </div>
  );
};

export default Profile;
