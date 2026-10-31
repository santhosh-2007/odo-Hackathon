import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  Package, 
  Layers, 
  RefreshCw, 
  Receipt, 
  IndianRupee, 
  Clock, 
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  FileText,
  Play
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  Legend,
  ComposedChart,
  Line
} from 'recharts';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/StatCard';
import Badge from '../../components/Badge';

const PIE_COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#EF4444', '#F59E0B', '#94A3B8'];

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningBilling, setRunningBilling] = useState(false);
  const { success, error } = useToast();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/admin');
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      error('Failed to load dashboard statistics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRunBilling = async () => {
    try {
      setRunningBilling(true);
      const res = await api.post('/invoices/trigger-recurring');
      if (res.data.success) {
        success(res.data.message);
        fetchDashboardData();
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to trigger billing run.');
    } finally {
      setRunningBilling(false);
    }
  };

  const summary = data?.summary || {};
  const charts = data?.charts || {};
  const recent = data?.recent || {};

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Admin Overview & Analytics
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time business performance from Brightloop MySQL database
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunBilling}
            disabled={runningBilling}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md shadow-slate-900/10 transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-white ${runningBilling ? 'animate-spin' : ''}`} />
            <span>{runningBilling ? 'Processing Cycles...' : 'Run Billing Engine'}</span>
          </button>

          <Link
            to="/subscriptions"
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-blue/20 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Subscriptions</span>
          </Link>
        </div>
      </div>

      {/* 8 Primary KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Customers"
          value={summary.totalCustomers || 0}
          icon={Users}
          color="blue"
          loading={loading}
          subtitle="Active clients"
        />
        <StatCard
          title="Total Products"
          value={summary.totalProducts || 0}
          icon={Package}
          color="purple"
          loading={loading}
          subtitle="SaaS & hosting items"
        />
        <StatCard
          title="Total Plans"
          value={summary.totalPlans || 0}
          icon={Layers}
          color="indigo"
          loading={loading}
          subtitle="Configured billing tiers"
        />
        <StatCard
          title="Active Subscriptions"
          value={summary.activeSubscriptions || 0}
          icon={RefreshCw}
          color="emerald"
          loading={loading}
          subtitle="Generating revenue"
        />
        <StatCard
          title="Total Invoices"
          value={summary.totalInvoices || 0}
          icon={Receipt}
          color="blue"
          loading={loading}
          subtitle={`₹${(summary.invoicedRevenue || 0).toLocaleString()} invoiced`}
        />
        <StatCard
          title="Total Revenue (Collected)"
          value={`₹${(summary.totalRevenue || 0).toLocaleString()}`}
          icon={IndianRupee}
          color="emerald"
          loading={loading}
          subtitle="Verified payments"
        />
        <StatCard
          title="Outstanding Payments"
          value={`₹${(summary.outstandingPayments || 0).toLocaleString()}`}
          icon={Clock}
          color="amber"
          loading={loading}
          subtitle="Pending collections"
        />
        <StatCard
          title="Overdue Invoices"
          value={`${summary.overdueCount || 0} (₹${(summary.overdueAmount || 0).toLocaleString()})`}
          icon={AlertTriangle}
          color="rose"
          loading={loading}
          subtitle="Immediate follow-up"
        />
      </div>

      {/* Charts Section: Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Monthly Revenue Collections</h3>
              <p className="text-xs text-slate-400">Total verified incoming payments per month</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <div className="h-72 w-full">
            {charts.monthlyRevenue && charts.monthlyRevenue.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts.monthlyRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2563EB" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month_label" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip 
                    formatter={(val) => [`₹${parseFloat(val).toLocaleString()}`, 'Revenue']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={2.5} fillOpacity={1} fill="url(#revenueGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No revenue records recorded yet
              </div>
            )}
          </div>
        </div>

        {/* Subscription Growth Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Subscription Growth</h3>
              <p className="text-xs text-slate-400">New subscriptions generated over time</p>
            </div>
            <RefreshCw className="w-5 h-5 text-brand-purple" />
          </div>
          <div className="h-72 w-full">
            {charts.subscriptionGrowth && charts.subscriptionGrowth.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.subscriptionGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month_label" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="new_subscriptions" name="New Subscriptions" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="active_subscriptions" name="Active" fill="#3B82F6" radius={[6, 6, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No subscription growth data yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Section: Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Status Chart */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">Invoice Payment Status</h3>
          <p className="text-xs text-slate-400 mb-4">Breakdown by current payment state</p>
          <div className="h-64 w-full">
            {charts.paymentStatusDistribution && charts.paymentStatusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.paymentStatusDistribution}
                    dataKey="count"
                    nameKey="payment_status"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {charts.paymentStatusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val, name, item) => [`${val} invoices (₹${parseFloat(item.payload.total_amount).toLocaleString()})`, name.toUpperCase()]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
                  />
                  <Legend 
                    formatter={(v) => v.toUpperCase()}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No invoice status distribution yet
              </div>
            )}
          </div>
        </div>

        {/* Active vs Paused vs Closed Subscriptions */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">Subscription Health</h3>
          <p className="text-xs text-slate-400 mb-4">Active vs Paused vs Closed lifecycle</p>
          <div className="h-64 w-full">
            {charts.subscriptionStatusBreakdown && charts.subscriptionStatusBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.subscriptionStatusBreakdown}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {charts.subscriptionStatusBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val, name, item) => [`${val} subscriptions (₹${parseFloat(item.payload.mrr_value).toLocaleString()})`, name.toUpperCase()]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
                  />
                  <Legend 
                    formatter={(v) => v.toUpperCase()}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No subscription breakdown yet
              </div>
            )}
          </div>
        </div>

        {/* Monthly Billing Overview (Invoiced vs Collected) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 mb-1">Billing Overview</h3>
          <p className="text-xs text-slate-400 mb-4">Invoiced vs Collected by month</p>
          <div className="h-64 w-full">
            {charts.billingOverview && charts.billingOverview.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={charts.billingOverview} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month_label" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v) => `₹${v}`} />
                  <Tooltip 
                    formatter={(val) => [`₹${parseFloat(val).toLocaleString()}`]}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}
                  />
                  <Bar dataKey="invoiced" name="Invoiced" fill="#93C5FD" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="collected" name="Collected" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                No billing history yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Recent Invoices</h3>
            <Link to="/invoices" className="text-xs font-semibold text-brand-blue hover:underline flex items-center gap-1">
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 text-sm">
            {recent.invoices && recent.invoices.length > 0 ? (
              recent.invoices.map((inv) => (
                <div key={inv.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <Link to={`/invoices/${inv.id}`} className="font-semibold text-brand-blue hover:underline">
                      {inv.invoice_number}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">{inv.company_name || inv.contact_name}</p>
                    <p className="text-[11px] text-slate-400">Date: {inv.invoice_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₹{parseFloat(inv.total_amount).toFixed(2)}</p>
                    <div className="mt-1">
                      <Badge status={inv.payment_status} size="xs" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-xs text-slate-400">No recent invoices.</p>
            )}
          </div>
        </div>

        {/* Recent Subscriptions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900">Recent Subscriptions</h3>
            <Link to="/subscriptions" className="text-xs font-semibold text-brand-blue hover:underline flex items-center gap-1">
              <span>View all</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-slate-100 text-sm">
            {recent.subscriptions && recent.subscriptions.length > 0 ? (
              recent.subscriptions.map((sub) => (
                <div key={sub.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <Link to={`/subscriptions/${sub.id}`} className="font-semibold text-brand-blue hover:underline">
                      {sub.subscription_number}
                    </Link>
                    <p className="text-xs text-slate-500 mt-0.5">{sub.company_name} — {sub.plan_name}</p>
                    <p className="text-[11px] text-slate-400">Next Billing: {sub.next_billing_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₹{parseFloat(sub.total_amount).toFixed(2)}</p>
                    <div className="mt-1">
                      <Badge status={sub.status} size="xs" />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-xs text-slate-400">No recent subscriptions.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
