import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck, User, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      error('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);
      success(`Welcome back, ${user.name}!`);

      // Role-based redirection
      if (user.role === 'customer') {
        navigate('/portal');
      } else if (user.role === 'staff') {
        navigate('/staff');
      } else {
        navigate('/admin');
      }
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Login helper
  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand Logo */}
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-blue to-brand-purple items-center justify-center text-white shadow-lg shadow-brand-blue/20 mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Sign in to Brightloop Software
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Subscription Management & Enterprise Billing Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-brand-blue hover:text-brand-purple transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue focus:bg-white transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-blue-light hover:opacity-95 shadow-md shadow-brand-blue/25 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 disabled:opacity-50 transition-all cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins Container */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-3">
              One-Click Demo Test Accounts
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@brightloop.com', 'Admin@12345')}
                className="flex flex-col items-center p-2 rounded-xl border border-purple-100 bg-purple-50/50 hover:bg-purple-100/70 text-purple-700 transition-colors"
              >
                <ShieldCheck className="w-4 h-4 mb-1" />
                <span className="text-[11px] font-bold">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('staff@brightloop.com', 'Staff@12345')}
                className="flex flex-col items-center p-2 rounded-xl border border-blue-100 bg-blue-50/50 hover:bg-blue-100/70 text-blue-700 transition-colors"
              >
                <Users className="w-4 h-4 mb-1" />
                <span className="text-[11px] font-bold">Staff</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('billing@acmecorp.com', 'Customer@12345')}
                className="flex flex-col items-center p-2 rounded-xl border border-emerald-100 bg-emerald-50/50 hover:bg-emerald-100/70 text-emerald-700 transition-colors"
              >
                <User className="w-4 h-4 mb-1" />
                <span className="text-[11px] font-bold">Customer</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-500">
              New customer?{' '}
              <Link to="/register" className="font-semibold text-brand-blue hover:text-brand-purple">
                Register customer account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
