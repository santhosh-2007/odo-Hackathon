import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Receipt, Clock, CheckCircle2, Download, ArrowRight, Layers, FileText } from 'lucide-react';
import api, { downloadInvoicePdf } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';

export default function CustomerPortal() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  const handleDownloadInvoice = async (inv) => {
    try {
      await downloadInvoicePdf(inv.id, inv.invoice_number);
      success(`Downloaded ${inv.invoice_number}.pdf`);
    } catch (err) {
      error('Failed to download invoice PDF.');
    }
  };

  useEffect(() => {
    async function fetchPortalData() {
      try {
        setLoading(true);
        const res = await api.get('/dashboard/customer');
        if (res.data.success) {
          setData(res.data);
        }
      } catch (err) {
        error('Failed to load customer portal details.');
      } finally {
        setLoading(false);
      }
    }
    fetchPortalData();
  }, []);

  const summary = data?.summary || {};
  const subscriptions = data?.subscriptions || [];
  const recentInvoices = data?.recentInvoices || [];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-navy-800 to-navy-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-sm mb-3">
            <span>Customer Self-Service Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Welcome, {user?.name}!
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Manage your active Brightloop Software subscriptions, review recurring invoices, track payments, and explore new enterprise plans.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to="/portal/plans"
              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl text-xs font-semibold shadow-md transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Explore Plans</span>
            </Link>
            <Link
              to="/portal/invoices"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold backdrop-blur-sm transition-all"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>View Invoices</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Active Subscriptions"
          value={summary.activeSubscriptions || 0}
          icon={RefreshCw}
          color="emerald"
          loading={loading}
          subtitle="Currently running services"
        />
        <StatCard
          title="Total Invoices"
          value={summary.totalInvoices || 0}
          icon={Receipt}
          color="blue"
          loading={loading}
          subtitle="Generated invoices"
        />
        <StatCard
          title="Outstanding Balance"
          value={`₹${(summary.totalOutstanding || 0).toLocaleString()}`}
          icon={Clock}
          color={summary.totalOutstanding > 0 ? 'rose' : 'emerald'}
          loading={loading}
          subtitle="Amount due for payment"
        />
        <StatCard
          title="Total Paid"
          value={`₹${(summary.totalPaid || 0).toLocaleString()}`}
          icon={CheckCircle2}
          color="emerald"
          loading={loading}
          subtitle="Lifetime settlement"
        />
      </div>

      {/* My Active Subscriptions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">My Subscriptions</h3>
            <p className="text-xs text-slate-400 mt-0.5">Your licensed Brightloop Software platforms</p>
          </div>
          <Link to="/portal/subscriptions" className="text-xs font-semibold text-brand-blue hover:underline flex items-center gap-1">
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {subscriptions.length > 0 ? (
            subscriptions.map((sub) => (
              <div key={sub.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2.5">
                    <span className="font-bold text-slate-900">{sub.plan_name}</span>
                    <Badge status={sub.status} size="xs" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Subscription ID: <span className="font-mono">{sub.subscription_number}</span> • Frequency: <span className="capitalize">{sub.billing_frequency}</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Term: {sub.start_date} to {sub.expiry_date}
                  </p>
                </div>

                <div className="flex items-center gap-6">
                  <div>
                    <p className="text-xs text-slate-400">Next Billing Date</p>
                    <p className="text-xs font-semibold text-slate-800">{sub.next_billing_date}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Billing Amount</p>
                    <p className="text-sm font-bold text-slate-900">₹{parseFloat(sub.total_amount).toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-slate-400">
              <p className="text-sm font-medium">No active subscriptions currently.</p>
              <Link to="/portal/plans" className="mt-2 inline-block text-xs text-brand-blue font-semibold hover:underline">
                Explore available plans &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Recent Invoices */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Invoices</h3>
            <p className="text-xs text-slate-400 mt-0.5">Your latest tax invoices and payment receipts</p>
          </div>
          <Link to="/portal/invoices" className="text-xs font-semibold text-brand-blue hover:underline flex items-center gap-1">
            <span>View all</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentInvoices.length > 0 ? (
            recentInvoices.map((inv) => (
              <div key={inv.id} className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                <div>
                  <p className="font-semibold text-slate-900">{inv.invoice_number}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Date: {inv.invoice_date} • Due: {inv.due_date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-900">₹{parseFloat(inv.total_amount).toFixed(2)}</p>
                    <div className="mt-0.5">
                      <Badge status={inv.payment_status} size="xs" />
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadInvoice(inv)}
                    className="p-2 text-slate-400 hover:text-brand-blue hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                    title="Download Official Tax Invoice PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="p-6 text-center text-xs text-slate-400">No invoices generated yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
