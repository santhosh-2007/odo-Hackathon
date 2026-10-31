import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowRight, ShieldCheck, User, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import OAuthModal from '../../components/OAuthModal';
import GoogleDirectModal from '../../components/GoogleDirectModal';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Social SSO Modal state
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [oauthModalOpen, setOauthModalOpen] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  // Google Direct Authentication state
  const [googleModalOpen, setGoogleModalOpen] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const { login, oauthLogin, googleLogin } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleRedirect = (userRole) => {
    if (userRole === 'customer') {
      navigate('/portal');
    } else if (userRole === 'staff') {
      navigate('/staff');
    } else {
      navigate('/admin');
    }
  };

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
      handleRedirect(user.role);
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenOAuth = (provider) => {
    setSelectedProvider(provider);
    setOauthModalOpen(true);
  };

  const handleOAuthAuthenticate = async (authData) => {
    try {
      setOauthLoading(true);
      const user = await oauthLogin(authData);
      success(`Signed in successfully with ${authData.provider.toUpperCase()}! Welcome, ${user.name}.`);
      setOauthModalOpen(false);
      handleRedirect(user.role);
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Social authentication failed.');
    } finally {
      setOauthLoading(false);
    }
  };

  const handleGoogleDirectAuth = async (authPayload) => {
    try {
      setGoogleLoading(true);
      const user = await googleLogin(authPayload);
      success(`Welcome to Brightloop Software, ${user.name}! Authenticated with Google.`);
      setGoogleModalOpen(false);
      handleRedirect(user.role);
    } catch (err) {
      error(err.response?.data?.message || err.message || 'Google authentication failed.');
    } finally {
      setGoogleLoading(false);
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
          {/* Social OAuth SSO Login Buttons */}
          <div className="space-y-2.5">
            {/* Google */}
            <button
              type="button"
              onClick={() => setGoogleModalOpen(true)}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-xs font-semibold text-slate-700 transition-all shadow-sm group cursor-pointer"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Microsoft */}
            <button
              type="button"
              onClick={() => handleOpenOAuth('microsoft')}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-xs font-semibold text-slate-700 transition-all shadow-sm group cursor-pointer"
            >
              <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z"/>
                <path fill="#81bc06" d="M12 1h10v10H12z"/>
                <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                <path fill="#ffba08" d="M12 12h10v10H12z"/>
              </svg>
              <span>Continue with Microsoft</span>
            </button>

            {/* GitHub */}
            <button
              type="button"
              onClick={() => handleOpenOAuth('github')}
              className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-xs font-semibold text-slate-700 transition-all shadow-sm group cursor-pointer"
            >
              <svg className="w-4 h-4 fill-slate-800 flex-shrink-0" viewBox="0 0 24 24">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              <span>Continue with GitHub</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                Or email credentials
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
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
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-blue-light hover:opacity-95 shadow-md shadow-brand-blue/25 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 disabled:opacity-50 transition-all cursor-pointer"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Logins Container */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
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

          <div className="mt-5 text-center">
            <p className="text-xs text-slate-500">
              New customer?{' '}
              <Link to="/register" className="font-semibold text-brand-blue hover:text-brand-purple">
                Register customer account
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* OAuth SSO Interactive Modal */}
      <OAuthModal
        isOpen={oauthModalOpen}
        onClose={() => setOauthModalOpen(false)}
        provider={selectedProvider}
        onAuthenticate={handleOAuthAuthenticate}
        loading={oauthLoading}
      />

      {/* Google Direct Authentication Modal */}
      <GoogleDirectModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        onDirectAuth={handleGoogleDirectAuth}
        loading={googleLoading}
      />
    </div>
  );
}
