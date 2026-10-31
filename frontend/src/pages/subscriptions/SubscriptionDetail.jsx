import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  RefreshCw, 
  CheckCircle2, 
  Play, 
  Pause, 
  RotateCw, 
  XCircle, 
  Calendar, 
  Receipt, 
  CreditCard, 
  Building, 
  Clock 
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/Badge';

export default function SubscriptionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { success, error } = useToast();

  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/subscriptions/${id}`);
      if (res.data.success) {
        setSub(res.data.data);
      }
    } catch (err) {
      error('Failed to load subscription details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [id]);

  const handleTransition = async (action) => {
    try {
      const res = await api.post(`/subscriptions/${id}/transition`, { action });
      success(res.data.message);
      fetchSubscription();
    } catch (err) {
      error(err.response?.data?.message || `Failed to perform ${action}.`);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 animate-pulse">
        Loading subscription record...
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="p-8 text-center text-slate-500">
        Subscription not found.
      </div>
    );
  }

  // Lifecycle steps
  const steps = ['draft', 'confirmed', 'active', 'closed'];
  const currentStepIdx = steps.indexOf(sub.status) >= 0 ? steps.indexOf(sub.status) : 2;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Subscriptions</span>
        </button>

        {/* Transition Actions */}
        {(role === 'admin' || role === 'staff') && (
          <div className="flex items-center gap-2 flex-wrap">
            {sub.status === 'draft' && (
              <button
                onClick={() => handleTransition('confirm')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm</span>
              </button>
            )}

            {['draft', 'confirmed'].includes(sub.status) && (
              <button
                onClick={() => handleTransition('activate')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Activate</span>
              </button>
            )}

            {sub.status === 'active' && (
              <button
                onClick={() => handleTransition('pause')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <Pause className="w-3.5 h-3.5" />
                <span>Pause</span>
              </button>
            )}

            {sub.status === 'paused' && (
              <button
                onClick={() => handleTransition('resume')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Resume</span>
              </button>
            )}

            {sub.status !== 'closed' && (
              <button
                onClick={() => handleTransition('close')}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Close</span>
              </button>
            )}

            {sub.status === 'closed' && (
              <button
                onClick={() => handleTransition('renew')}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-brand-purple hover:bg-brand-purple-light text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
              >
                <RotateCw className="w-3.5 h-3.5" />
                <span>Renew (+1 Year)</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Subscription Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                {sub.subscription_number}
              </h2>
              <Badge status={sub.status} />
              <Badge status={sub.billing_frequency} showDot={false} />
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Created on {sub.created_at?.slice(0, 10)} • Payment Terms: <span className="capitalize">{sub.payment_terms?.replace('_', ' ')}</span>
            </p>
          </div>

          <div className="text-left sm:text-right">
            <span className="text-xs text-slate-400 uppercase tracking-wider block">Billing Amount</span>
            <span className="text-2xl font-bold text-slate-900">₹{parseFloat(sub.total_amount).toFixed(2)}</span>
            <span className="text-xs text-slate-500 block">per {sub.billing_frequency}</span>
          </div>
        </div>

        {/* Workflow Visual Stepper */}
        <div className="py-2">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Subscription Status Workflow</p>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-0.5 bg-slate-200 z-0"></div>
            {['Draft', 'Confirmed', 'Active', 'Closed'].map((stepName, sIdx) => {
              const key = stepName.toLowerCase();
              const isPast = steps.indexOf(sub.status) >= sIdx || sub.status === 'paused';
              const isCurrent = sub.status === key || (key === 'active' && sub.status === 'paused');

              return (
                <div key={sIdx} className="relative z-10 flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCurrent 
                      ? 'bg-brand-blue text-white ring-4 ring-blue-100' 
                      : isPast 
                      ? 'bg-emerald-500 text-white' 
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {sIdx + 1}
                  </div>
                  <span className={`text-xs mt-1.5 font-medium ${isCurrent ? 'text-brand-blue font-bold' : 'text-slate-500'}`}>
                    {stepName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Key Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 p-4 bg-slate-50/75 rounded-2xl border border-slate-200/80 text-xs">
          <div>
            <p className="text-slate-400 uppercase font-semibold">Subscriber / Client</p>
            <p className="text-slate-900 font-bold mt-1 text-sm">{sub.company_name || sub.contact_name}</p>
            <p className="text-slate-500">{sub.customer_email}</p>
            <p className="text-slate-500">{sub.customer_code}</p>
          </div>

          <div>
            <p className="text-slate-400 uppercase font-semibold">Billing Timeline</p>
            <p className="text-slate-700 mt-1"><span className="font-semibold">Next Billing:</span> {sub.next_billing_date}</p>
            <p className="text-slate-700"><span className="font-semibold">Start Date:</span> {sub.start_date}</p>
            <p className="text-slate-700"><span className="font-semibold">Expiry Date:</span> {sub.expiry_date}</p>
          </div>

          <div>
            <p className="text-slate-400 uppercase font-semibold">Plan Rules Configured</p>
            <p className="text-slate-700 mt-1">Pause Allowed: <span className="font-semibold">{sub.pause_allowed ? 'Yes' : 'No'}</span></p>
            <p className="text-slate-700">Early Closure: <span className="font-semibold">{sub.early_closure_allowed ? 'Yes' : 'No'}</span></p>
            <p className="text-slate-700">Auto Close at Expiry: <span className="font-semibold">{sub.auto_close ? 'Yes' : 'No'}</span></p>
          </div>
        </div>

        {/* Subscription Lines Table */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Service Line Items</h3>
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Item</th>
                  <th className="px-5 py-3 text-right">Qty</th>
                  <th className="px-5 py-3 text-right">Unit Price</th>
                  <th className="px-5 py-3 text-right">Tax (%)</th>
                  <th className="px-5 py-3 text-right">Total (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sub.lines && sub.lines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-900">{line.product_name}</p>
                      <p className="text-xs text-slate-500">{line.description}</p>
                      {line.variant_name && <span className="text-[11px] text-brand-blue font-medium">{line.variant_name}</span>}
                    </td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-700">{line.quantity}</td>
                    <td className="px-5 py-3.5 text-right font-medium text-slate-700">₹{parseFloat(line.unit_price).toFixed(2)}</td>
                    <td className="px-5 py-3.5 text-right text-slate-600">₹{parseFloat(line.tax_amount || 0).toFixed(2)} ({line.tax_rate}%)</td>
                    <td className="px-5 py-3.5 text-right font-bold text-slate-900">₹{parseFloat(line.line_total).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Generated Invoices History */}
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">Billing & Invoices History</h3>
          <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100">
            {sub.invoices && sub.invoices.length > 0 ? (
              sub.invoices.map((inv) => (
                <div key={inv.id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div>
                    <Link
                      to={role === 'customer' ? `/portal/invoices/${inv.id}` : `/invoices/${inv.id}`}
                      className="font-semibold text-brand-blue hover:underline text-sm"
                    >
                      {inv.invoice_number}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">Invoice Date: {inv.invoice_date} • Due: {inv.due_date}</p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900">₹{parseFloat(inv.total_amount).toFixed(2)}</p>
                      {parseFloat(inv.amount_due) > 0 && (
                        <p className="text-[11px] text-rose-500 font-medium">Due: ₹{parseFloat(inv.amount_due).toFixed(2)}</p>
                      )}
                    </div>
                    <Badge status={inv.payment_status} size="xs" />
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-xs text-slate-400">No recurring invoices generated for this subscription yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
