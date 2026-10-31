import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, RefreshCw, FileText, Receipt, ArrowRight, PlusCircle, CreditCard } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';

export default function StaffDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { error } = useToast();

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/staff');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        error('Failed to load staff operations dashboard.');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const summary = data?.summary || {};
  const renewals = data?.upcomingRenewals || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Staff Operations Hub
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage customer accounts, generate quotations, and monitor billing cycles
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/quotations"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-blue/20 transition-all"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Quotation</span>
          </Link>
          <Link
            to="/payments"
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Record Payment</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active Customers"
          value={summary.totalCustomers || 0}
          icon={Users}
          color="blue"
          loading={loading}
          subtitle="Managed in CRM"
        />
        <StatCard
          title="Active Subscriptions"
          value={summary.activeSubscriptions || 0}
          icon={RefreshCw}
          color="emerald"
          loading={loading}
          subtitle="Operational contracts"
        />
        <StatCard
          title="Pending Quotations"
          value={summary.pendingQuotations || 0}
          icon={FileText}
          color="purple"
          loading={loading}
          subtitle="Awaiting client acceptance"
        />
        <StatCard
          title="Unpaid Invoices"
          value={`${summary.unpaidInvoicesCount || 0} (₹${(summary.unpaidInvoicesAmount || 0).toLocaleString()})`}
          icon={Receipt}
          color="amber"
          loading={loading}
          subtitle="Pending settlements"
        />
      </div>

      {/* Upcoming Renewals & Billing Milestones */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Upcoming Renewals & Billing Cycles</h3>
            <p className="text-xs text-slate-400 mt-0.5">Active subscriptions scheduled for next billing</p>
          </div>
          <Link to="/subscriptions" className="text-xs font-semibold text-brand-blue hover:underline flex items-center gap-1">
            <span>Manage all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100 text-sm">
          {renewals.length > 0 ? (
            renewals.map((sub) => (
              <div key={sub.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">{sub.subscription_number}</span>
                    <span className="text-xs text-slate-400">•</span>
                    <span className="text-xs font-medium text-slate-600">{sub.company_name}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{sub.plan_name}</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-400">Next Billing Date</p>
                    <p className="text-xs font-semibold text-slate-800">{sub.next_billing_date}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs text-slate-400">Amount</p>
                    <p className="text-sm font-bold text-slate-900">₹{parseFloat(sub.total_amount).toFixed(2)}</p>
                  </div>
                  <Link
                    to={`/subscriptions/${sub.id}`}
                    className="px-3 py-1.5 border border-slate-200 hover:border-brand-blue hover:text-brand-blue rounded-xl text-xs font-medium transition-colors"
                  >
                    View
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="p-6 text-center text-xs text-slate-400">No upcoming renewals found.</p>
          )}
        </div>
      </div>
    </div>
  );
}
