import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, ArrowLeft, ArrowRight, KeyRound, CheckCircle2 } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: request, 2: reset, 3: success
  const [loading, setLoading] = useState(false);

  const { success, error } = useToast();

  const handleRequestToken = async (e) => {
    e.preventDefault();
    if (!email) {
      error('Please enter your registered email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/forgot-password', { email });
      success(res.data.message);
      if (res.data.resetToken) {
        setToken(res.data.resetToken);
      }
      setStep(2);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to request reset token.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      error('New passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/auth/reset-password', {
        token,
        newPassword,
        confirmPassword
      });
      success(res.data.message);
      setStep(3);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-blue to-brand-purple items-center justify-center text-white shadow-lg shadow-brand-blue/20 mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Reset Your Password
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Brightloop Secure Identity & Authentication Service
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80">
          {step === 1 && (
            <form onSubmit={handleRequestToken} className="space-y-4">
              <p className="text-xs text-slate-500">
                Enter your account email to generate a secure, expiring password reset token.
              </p>
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
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-blue-light hover:opacity-95 shadow-md shadow-brand-blue/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                <span>{loading ? 'Sending Request...' : 'Send Reset Instructions'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                <span className="font-semibold">Reset Token Generated:</span> Token expires in 1 hour. In this environment, your token is populated below.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Reset Token
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Paste your reset token"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 8 chars, 1 Upper, 1 Lower, 1 Special"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-blue to-brand-blue-light hover:opacity-95 shadow-md shadow-brand-blue/25 disabled:opacity-50 transition-all cursor-pointer"
              >
                <span>{loading ? 'Updating Password...' : 'Update Password'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-center py-4 space-y-4">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="text-lg font-bold text-slate-900">Password Reset Complete!</h3>
              <p className="text-xs text-slate-500">
                Your password has been securely updated. You can now log into your Brightloop account.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl text-sm font-semibold text-white bg-brand-blue hover:bg-brand-blue-light transition-all"
              >
                <span>Proceed to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}

          <div className="mt-6 text-center pt-4 border-t border-slate-100">
            <Link to="/login" className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
