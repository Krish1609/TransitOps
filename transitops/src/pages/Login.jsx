import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Fleet Manager');
  const [rememberMe, setRememberMe] = useState(false);
  
  // Forgot / Reset states
  const [view, setView] = useState('login'); // 'login' | 'forgot' | 'reset'
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Load remembered settings on mount
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }

    const savedEmail = localStorage.getItem('rememberedEmail');
    const savedRole = localStorage.getItem('rememberedRole');
    const isRemembered = localStorage.getItem('rememberMe') === 'true';

    if (isRemembered && savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
      if (savedRole) {
        setRole(savedRole);
      }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    const result = await login(email, password, role, rememberMe);
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setErrorMsg(result.error);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    
    if (!email.trim() || !role) {
      setErrorMsg('Please specify your registered email and role.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/forgot-password', {
        email: email.trim(),
        role
      });
      setSuccessMsg(response.data.message);
      // Advance to verification view
      setView('reset');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg('Failed to process reset request. Verify connection settings.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!code.trim() || !newPassword || !confirmPassword) {
      setErrorMsg('All fields are required.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMsg('Your security password must consist of at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post('http://localhost:5000/api/auth/reset-password', {
        email: email.trim(),
        role,
        code: code.trim(),
        newPassword
      });
      alert(response.data.message);
      setPassword('');
      setCode('');
      setNewPassword('');
      setConfirmPassword('');
      setErrorMsg('');
      setSuccessMsg('Your security credentials have been updated. Log in using your new password.');
      setView('login');
    } catch (err) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.error) {
        setErrorMsg(err.response.data.error);
      } else {
        setErrorMsg('Reprogram action failed. Verify reset token expiration.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex shadow-inner items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background gradients */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.63 9.89a14.98 14.98 0 0 0-6.17 12.12c4.12 0 7.82-1.87 10.37-4.81ZM9.63 9.89a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM21 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />
            </svg>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">TransitOps</h1>
          <p className="text-slate-400 text-sm mt-1.5">Intelligent Fleet & Transport Management</p>
        </div>

        {/* Error notification banner */}
        {errorMsg && (
          <div className="mb-6 bg-red-950/45 border border-red-500/20 text-red-300 rounded-xl px-4 py-3 text-sm flex gap-3 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
            </svg>
            <span className="text-left">{errorMsg}</span>
          </div>
        )}

        {/* Success notification banner */}
        {successMsg && (
          <div className="mb-6 bg-emerald-950/45 border border-emerald-500/20 text-emerald-305 rounded-xl px-4 py-3 text-sm flex gap-3 animate-bounce">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
            <span className="text-left">{successMsg}</span>
          </div>
        )}

        {/* View 1: Login Form */}
        {view === 'login' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 text-left" htmlFor="email">
                Corporate Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. manager@transitops.com"
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/70"
              />
            </div>

            {/* Password field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 text-left" htmlFor="password">
                Secure Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/70"
              />
            </div>

            {/* Role Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 text-left" htmlFor="role">
                Gated Role
              </label>
              <div className="relative">
                <select
                  id="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm appearance-none transition-all focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/70"
                >
                  <option value="Fleet Manager">Fleet Manager</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Safety Officer">Safety Officer</option>
                  <option value="Financial Analyst">Financial Analyst</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

             {/* Remember Me and Extra options */}
             <div className="flex items-center justify-between pt-1">
               <label className="flex items-center gap-2 cursor-pointer group">
                 <input
                   type="checkbox"
                   checked={rememberMe}
                   onChange={(e) => setRememberMe(e.target.checked)}
                   className="sr-only"
                 />
                 <div className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                   rememberMe ? 'bg-indigo-600 border border-indigo-500' : 'bg-slate-950/80 border border-slate-800'
                 }`}>
                   <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} className={`w-2.5 h-2.5 text-white transition-opacity ${
                     rememberMe ? 'opacity-100' : 'opacity-0'
                   }`}>
                     <polyline points="20 6 9 17 4 12" />
                   </svg>
                 </div>
                 <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">Remember me</span>
               </label>
              <button 
                type="button" 
                onClick={() => { setErrorMsg(''); setSuccessMsg(''); setView('forgot'); }} 
                className="text-xs text-indigo-500 hover:text-indigo-400 transition-colors font-semibold"
              >
                Forgot Password?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-850 disabled:text-indigo-250 text-white font-medium rounded-xl py-3 mt-2 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-[0.99]"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Verifying credentials...</span>
                </>
              ) : (
                <span>Access Command Center</span>
              )}
            </button>
          </form>
        )}

        {/* View 2: Forgot Password Form */}
        {view === 'forgot' && (
          <form onSubmit={handleForgotPassword} className="space-y-5">
            <div className="text-left bg-slate-950/40 p-4 border border-slate-900 rounded-2xl mb-2 text-xs text-slate-350 leading-relaxed">
              Specify your registered email and role structure in the controls below. If found, a 6-digit verification code will be generated and routed via Ethereal SMTP.
            </div>

            {/* Email field */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 text-left" htmlFor="email-reset">
                Registered Email
              </label>
              <input
                id="email-reset"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. manager@transitops.com"
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-xl px-4 py-3 text-sm transition-all focus:outline-none focus:border-indigo-500/70 focus:ring-1 focus:ring-indigo-500/70"
              />
            </div>

            {/* Role Dropdown */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 text-left" htmlFor="role-reset">
                Account Role
              </label>
              <div className="relative">
                <select
                  id="role-reset"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 rounded-xl px-4 py-3 text-sm appearance-none transition-all focus:outline-none focus:border-indigo-500/70"
                >
                  <option value="Fleet Manager">Fleet Manager</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Safety Officer">Safety Officer</option>
                  <option value="Financial Analyst">Financial Analyst</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Submit Code Request */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-850 text-white font-medium rounded-xl py-3 mt-2 transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              {isLoading ? 'Requesting Pin...' : 'Send Reset Verification Pin'}
            </button>

            <div className="text-center pt-2">
              <button 
                type="button" 
                onClick={() => { setErrorMsg(''); setSuccessMsg(''); setView('login'); }}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors underline"
              >
                Return to Sign In
              </button>
            </div>
          </form>
        )}

        {/* View 3: Reset Password Verification Form */}
        {view === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="text-left bg-slate-950/40 p-4 border border-slate-900 rounded-2xl text-xs text-slate-350 leading-relaxed">
              Verification Pin forwarded to <b>{email}</b>. Provide the code and your new credentials to reprogram the safety record.
            </div>

            {/* Pin Code input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 text-left" htmlFor="reset-pin">
                6-Digit verification code
              </label>
              <input
                id="reset-pin"
                type="text"
                required
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest font-bold bg-slate-950/80 border border-slate-800 text-indigo-400 placeholder-slate-650 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-indigo-500/70"
              />
            </div>

            {/* New Password input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 text-left" htmlFor="new-password">
                New secure password *
              </label>
              <input
                id="new-password"
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters"
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/70"
              />
            </div>

            {/* Confirm Password input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 text-left" htmlFor="confirm-password">
                Confirm new password *
              </label>
              <input
                id="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                className="w-full bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-600 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500/70"
              />
            </div>

            {/* Submit reset */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-indigo-650 hover:bg-indigo-600 disabled:bg-indigo-850 text-white font-medium rounded-xl py-3 mt-3 transition-all tracking-wide shadow-md"
            >
              {isLoading ? 'Reprogramming Access...' : 'Reprogram Secure Password'}
            </button>

            <div className="flex items-center justify-between text-xs pt-2 pr-1 pl-1">
              <button 
                type="button" 
                onClick={() => { setErrorMsg(''); setSuccessMsg(''); setView('forgot'); }} 
                className="text-indigo-400 hover:text-indigo-300 transition-colors font-medium"
              >
                Resend Code
              </button>
              <button 
                type="button" 
                onClick={() => { setErrorMsg(''); setSuccessMsg(''); setView('login'); }} 
                className="text-slate-400 hover:text-slate-200 transition-colors font-medium"
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
