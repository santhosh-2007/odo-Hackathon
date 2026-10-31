import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  User, 
  LogOut, 
  Sparkles, 
  Play, 
  CheckCircle2, 
  AlertCircle,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import Badge from './Badge';

export default function Navbar({ onMenuToggle }) {
  const { user, logout, role } = useAuth();
  const { success, error, info } = useToast();
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [runningBilling, setRunningBilling] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Quick Action: Run Recurring Billing Engine
  const handleRunBilling = async () => {
    try {
      setRunningBilling(true);
      const res = await api.post('/invoices/trigger-recurring');
      if (res.data.success) {
        success(res.data.message);
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to trigger billing run.');
    } finally {
      setRunningBilling(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile Menu Toggle & Breadcrumb Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500">
          <span className="font-semibold text-slate-800">Brightloop Software</span>
          <span>/</span>
          <span className="capitalize text-slate-600">{role} Workspace</span>
        </div>
      </div>

      {/* Right: Actions, Notifications, User Menu */}
      <div className="flex items-center gap-3">
        {/* Quick Billing Engine Run (Staff & Admin) */}
        {(role === 'admin' || role === 'staff') && (
          <button
            onClick={handleRunBilling}
            disabled={runningBilling}
            className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all duration-150 disabled:opacity-50"
            title="Scan active subscriptions and generate due invoices"
          >
            <Play className={`w-3.5 h-3.5 fill-white ${runningBilling ? 'animate-spin' : ''}`} />
            <span>{runningBilling ? 'Processing...' : 'Run Billing Engine'}</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-blue rounded-full"></span>
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 py-3 z-50 animate-fade-in">
              <div className="px-4 py-2 border-b border-slate-100 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">System Alerts</p>
                <span className="text-[10px] text-brand-blue font-semibold bg-blue-50 px-2 py-0.5 rounded-full">Live</span>
              </div>
              <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                <div className="p-3 text-xs hover:bg-slate-50 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800">Recurring Billing Automated</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Automated invoice checks run continuously.</p>
                  </div>
                </div>
                <div className="p-3 text-xs hover:bg-slate-50 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-slate-800">Overdue Invoice Surveillance</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Invoices past grace period flagged automatically.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-blue to-brand-purple flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'BL'}
            </div>
            <div className="hidden sm:block text-left pr-1">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user?.name}</p>
              <p className="text-[11px] text-slate-400 capitalize">{user?.role}</p>
            </div>
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-fade-in">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-sm font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                <div className="mt-2">
                  <Badge status={user?.role} size="xs" />
                </div>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-brand-blue transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Account Profile</span>
                </Link>
              </div>

              <div className="border-t border-slate-100 pt-1">
                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Log out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
