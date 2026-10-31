import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Building, Mail, Phone, RefreshCw, Receipt, CreditCard, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/Badge';

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { error } = useToast();

  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('subscriptions');

  useEffect(() => {
    async function fetchCustomer() {
      try {
        setLoading(true);
        const res = await api.get(`/customers/${id}`);
        if (res.data.success) {
          setCustomer(res.data.data);
        }
      } catch (err) {
        error('Failed to load customer profile.');
      } finally {
        setLoading(false);
      }
    }
    fetchCustomer();
  }, [id]);

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 animate-pulse">
        Loading customer record...
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center text-slate-500">
        Customer record not found.
      </div>
    );
  }

  const subscriptions = customer.subscriptions || [];
  const invoices = customer.invoices || [];
  const payments = customer.payments || [];

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </button>
      </div>

      {/* Customer Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-brand-blue to-brand-purple flex items-center justify-center text-white text-xl font-bold shadow-md">
              {customer.company_name ? customer.company_name.slice(0, 2).toUpperCase() : 'CU'}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {customer.company_name || customer.contact_name}
                </h2>
                <Badge status={customer.status} />
              </div>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                {customer.customer_code} • Contact: {customer.contact_name}
              </p>
            </div>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs">
          <div className="space-y-1">
            <p className="text-slate-400 uppercase font-semibold">Contact Channels</p>
            <p className="text-slate-800 font-medium">{customer.email}</p>
            <p className="text-slate-600">{customer.phone || 'No phone recorded'}</p>
          </div>

          <div className="space-y-1">
            <p className="text-slate-400 uppercase font-semibold">Fiscal Details</p>
            <p className="text-slate-800 font-mono">GSTIN: {customer.tax_id || 'Not registered'}</p>
            <p className="text-slate-600">Currency: {customer.currency || 'INR'}</p>
          </div>

          <div className="space-y-1">
            <p className="text-slate-400 uppercase font-semibold">Billing Address</p>
            <p className="text-slate-700">{customer.billing_address || 'No billing address provided'}</p>
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 gap-4 pt-4">
          <button
            onClick={() => setActiveTab('subscriptions')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'subscriptions' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Subscriptions ({subscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab('invoices')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'invoices' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Invoices ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('payments')}
            className={`pb-3 text-xs font-bold transition-all relative ${
              activeTab === 'payments' ? 'text-brand-blue border-b-2 border-brand-blue' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Payments ({payments.length})
          </button>
        </div>

        {/* Tab 1: Subscriptions */}
        {activeTab === 'subscriptions' && (
          <div className="divide-y divide-slate-100">
            {subscriptions.length > 0 ? (
              subscriptions.map((s) => (
                <div key={s.id} className="py-4 flex items-center justify-between hover:bg-slate-50 transition-colors px-2 rounded-xl">
                  <div>
                    <Link to={`/subscriptions/${s.id}`} className="font-semibold text-brand-blue hover:underline text-sm">
                      {s.subscription_number}
                    </Link>
                    <p className="text-xs text-slate-600 mt-0.5">{s.plan_name}</p>
                    <p className="text-[11px] text-slate-400">Next Billing: {s.next_billing_date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-slate-900 text-sm">₹{parseFloat(s.total_amount).toFixed(2)}</span>
                    <Badge status={s.status} size="xs" />
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-xs text-slate-400">No subscriptions found for this customer.</p>
            )}
          </div>
        )}

        {/* Tab 2: Invoices */}
        {activeTab === 'invoices' && (
          <div className="divide-y divide-slate-100">
            {invoices.length > 0 ? (
              invoices.map((i) => (
                <div key={i.id} className="py-4 flex items-center justify-between hover:bg-slate-50 transition-colors px-2 rounded-xl">
                  <div>
                    <Link to={`/invoices/${i.id}`} className="font-semibold text-brand-blue hover:underline text-sm">
                      {i.invoice_number}
                    </Link>
                    <p className="text-xs text-slate-400 mt-0.5">Date: {i.invoice_date} • Due: {i.due_date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="font-bold text-slate-900 text-sm">₹{parseFloat(i.total_amount).toFixed(2)}</span>
                      {parseFloat(i.amount_due) > 0 && (
                        <span className="block text-[11px] text-rose-500 font-semibold">Due: ₹{parseFloat(i.amount_due).toFixed(2)}</span>
                      )}
                    </div>
                    <Badge status={i.payment_status} size="xs" />
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-xs text-slate-400">No invoices generated for this customer.</p>
            )}
          </div>
        )}

        {/* Tab 3: Payments */}
        {activeTab === 'payments' && (
          <div className="divide-y divide-slate-100">
            {payments.length > 0 ? (
              payments.map((p) => (
                <div key={p.id} className="py-4 flex items-center justify-between hover:bg-slate-50 transition-colors px-2 rounded-xl">
                  <div>
                    <p className="font-mono font-semibold text-slate-900 text-sm">{p.payment_number}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{p.payment_date} • {p.payment_method?.replace('_', ' ')} • Ref: {p.transaction_reference}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-emerald-600 text-sm">₹{parseFloat(p.amount).toFixed(2)}</span>
                    <Badge status={p.status} size="xs" />
                  </div>
                </div>
              ))
            ) : (
              <p className="p-6 text-center text-xs text-slate-400">No payment records found for this customer.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
