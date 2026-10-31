import React, { useState, useEffect } from 'react';
import { User, Lock, Building, Phone, Mail, CheckCircle2, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/Badge';

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { success, error } = useToast();

  const [loading, setLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    company_name: '',
    billing_address: '',
    shipping_address: '',
    tax_id: ''
  });

  // Password Change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [changingPass, setChangingPass] = useState(false);

  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await api.get('/auth/me');
        if (res.data.success) {
          const u = res.data.user;
          setProfileForm({
            name: u.name || '',
            phone: u.phone || '',
            company_name: u.customer?.company_name || '',
            billing_address: u.customer?.billing_address || '',
            shipping_address: u.customer?.shipping_address || '',
            tax_id: u.customer?.tax_id || ''
          });
        }
      } catch (err) {
        console.error('Failed to load profile details:', err);
      }
    }
    loadProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.put('/auth/profile', profileForm);
      success(res.data.message);
      updateUser({ name: profileForm.name, phone: profileForm.phone });
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      error('New password and confirmation do not match.');
      return;
    }

    try {
      setChangingPass(true);
      const res = await api.put('/auth/change-password', passwordForm);
      success(res.data.message);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Profile & Security</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your personal credentials, contact points, and billing preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Summary Profile Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-brand-blue to-brand-purple flex items-center justify-center text-white text-2xl font-bold mx-auto shadow-md">
            {user?.name ? user.name.slice(0, 2).toUpperCase() : 'BL'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">{user?.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
            <div className="mt-2.5">
              <Badge status={user?.role} />
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 text-xs text-slate-400">
            Brightloop Software Authenticated Session
          </div>
        </div>

        {/* Right: Profile Edit & Password Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Profile */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">Personal & Organization Details</h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profileForm.name}
                    onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              {user?.role === 'customer' && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Company Name</label>
                      <input
                        type="text"
                        value={profileForm.company_name}
                        onChange={(e) => setProfileForm({ ...profileForm, company_name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tax ID / GSTIN</label>
                      <input
                        type="text"
                        value={profileForm.tax_id}
                        onChange={(e) => setProfileForm({ ...profileForm, tax_id: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono uppercase"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Billing Address</label>
                    <textarea
                      rows={2}
                      value={profileForm.billing_address}
                      onChange={(e) => setProfileForm({ ...profileForm, billing_address: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl text-xs font-semibold shadow-md transition-all"
                >
                  {loading ? 'Saving...' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 mb-4">Change Security Password</h3>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Current Password *</label>
                <input
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">New Password *</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Min 8 chars, 1 uppercase, special"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Confirm New Password *</label>
                  <input
                    type="password"
                    required
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={changingPass}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md transition-all"
                >
                  {changingPass ? 'Changing...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
