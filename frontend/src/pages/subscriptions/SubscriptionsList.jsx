import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, Plus, Eye, Play, Pause, RotateCw, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';

export default function SubscriptionsList() {
  const { role } = useAuth();
  const { success, error } = useToast();

  const [subscriptions, setSubscriptions] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [subForm, setSubForm] = useState({
    customer_id: '',
    plan_id: '',
    start_date: new Date().toISOString().split('T')[0],
    payment_terms: 'immediate',
    billing_frequency: 'monthly',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sRes, cRes, pRes] = await Promise.all([
        api.get('/subscriptions'),
        role !== 'customer' ? api.get('/customers') : Promise.resolve({ data: { success: true, data: [] } }),
        api.get('/plans')
      ]);

      if (sRes.data.success) setSubscriptions(sRes.data.data);
      if (cRes.data.success) setCustomers(cRes.data.data);
      if (pRes.data.success) setPlans(pRes.data.data);
    } catch (err) {
      error('Failed to load subscriptions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setSubForm({
      customer_id: customers[0]?.id || '',
      plan_id: plans[0]?.id || '',
      start_date: new Date().toISOString().split('T')[0],
      payment_terms: 'immediate',
      billing_frequency: plans[0]?.billing_frequency || 'monthly',
      notes: ''
    });
    setCreateModalOpen(true);
  };

  const handleCreateSubscription = async (e) => {
    e.preventDefault();
    try {
      const selectedPlan = plans.find((p) => String(p.id) === String(subForm.plan_id));
      if (!selectedPlan) {
        error('Please select a valid subscription plan.');
        return;
      }

      const res = await api.post('/subscriptions', {
        customer_id: subForm.customer_id,
        plan_id: subForm.plan_id,
        start_date: subForm.start_date,
        payment_terms: subForm.payment_terms,
        billing_frequency: subForm.billing_frequency,
        notes: subForm.notes,
        lines: [
          {
            product_id: selectedPlan.product_id,
            variant_id: selectedPlan.variant_id || null,
            description: `${selectedPlan.name} (${selectedPlan.billing_frequency})`,
            quantity: 1,
            unit_price: selectedPlan.price,
            tax_rate: 18,
            discount_amount: 0
          }
        ]
      });

      success(res.data.message);
      setCreateModalOpen(false);
      fetchData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create subscription.');
    }
  };

  // Status transitions
  const handleTransition = async (id, action) => {
    try {
      const res = await api.post(`/subscriptions/${id}/transition`, { action });
      success(res.data.message);
      fetchData();
    } catch (err) {
      error(err.response?.data?.message || `Failed to ${action} subscription.`);
    }
  };

  const columns = [
    {
      header: 'Subscription #',
      accessor: 'subscription_number',
      render: (row) => (
        <Link
          to={role === 'customer' ? `/portal/subscriptions/${row.id}` : `/subscriptions/${row.id}`}
          className="font-semibold text-brand-blue hover:underline"
        >
          {row.subscription_number}
        </Link>
      )
    },
    {
      header: 'Customer',
      accessor: 'company_name',
      render: (row) => (
        <div>
          <span className="font-medium text-slate-800">{row.company_name || row.contact_name}</span>
          <span className="block text-xs text-slate-400">{row.customer_email}</span>
        </div>
      )
    },
    {
      header: 'Plan / Product',
      accessor: 'plan_name',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900">{row.plan_name}</span>
          <span className="block text-xs text-slate-400">{row.product_name}</span>
        </div>
      )
    },
    {
      header: 'Frequency',
      accessor: 'billing_frequency',
      render: (row) => <Badge status={row.billing_frequency} />
    },
    {
      header: 'Next Billing Date',
      accessor: 'next_billing_date',
      render: (row) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800">{row.next_billing_date}</span>
          <span className="block text-[11px] text-slate-400">Expires: {row.expiry_date}</span>
        </div>
      )
    },
    {
      header: 'Total / Cycle',
      accessor: 'total_amount',
      render: (row) => (
        <div className="font-bold text-slate-900">
          ₹{parseFloat(row.total_amount).toFixed(2)}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status} />
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Link
            to={role === 'customer' ? `/portal/subscriptions/${row.id}` : `/subscriptions/${row.id}`}
            className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-4 h-4" />
          </Link>

          {(role === 'admin' || role === 'staff') && (
            <>
              {row.status === 'draft' && (
                <button
                  onClick={() => handleTransition(row.id, 'confirm')}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Confirm Subscription"
                >
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              )}

              {['draft', 'confirmed'].includes(row.status) && (
                <button
                  onClick={() => handleTransition(row.id, 'activate')}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Activate Subscription"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}

              {row.status === 'active' && (
                <button
                  onClick={() => handleTransition(row.id, 'pause')}
                  className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                  title="Pause Subscription"
                >
                  <Pause className="w-4 h-4" />
                </button>
              )}

              {row.status === 'paused' && (
                <button
                  onClick={() => handleTransition(row.id, 'resume')}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Resume Subscription"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}

              {row.status !== 'closed' && (
                <button
                  onClick={() => handleTransition(row.id, 'close')}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Close Subscription"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              )}

              {row.status === 'closed' && (
                <button
                  onClick={() => handleTransition(row.id, 'renew')}
                  className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="Renew Subscription"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscriptions Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor client recurring contracts, billing cycles, renewals, and status lifecycle
          </p>
        </div>

        {(role === 'admin' || role === 'staff') && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-blue/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Subscription</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={subscriptions}
        loading={loading}
        searchPlaceholder="Search subscription number, client, or plan..."
        searchKey="subscription_number"
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'paused', label: 'Paused' },
              { value: 'closed', label: 'Closed' },
              { value: 'draft', label: 'Draft' }
            ]
          },
          {
            key: 'billing_frequency',
            label: 'Frequency',
            options: [
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' }
            ]
          }
        ]}
      />

      {/* Direct Create Subscription Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Subscription"
        size="md"
      >
        <form onSubmit={handleCreateSubscription} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Customer *</label>
            <select
              required
              value={subForm.customer_id}
              onChange={(e) => setSubForm({ ...subForm, customer_id: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
            >
              <option value="">Select Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name || c.contact_name} ({c.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Subscription Plan *</label>
            <select
              required
              value={subForm.plan_id}
              onChange={(e) => {
                const pl = plans.find((p) => String(p.id) === String(e.target.value));
                setSubForm({
                  ...subForm,
                  plan_id: e.target.value,
                  billing_frequency: pl?.billing_frequency || 'monthly'
                });
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
            >
              <option value="">Select Plan</option>
              {plans.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name} — ₹{parseFloat(pl.price).toFixed(2)} / {pl.billing_frequency}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Start Date</label>
              <input
                type="date"
                required
                value={subForm.start_date}
                onChange={(e) => setSubForm({ ...subForm, start_date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Terms</label>
              <select
                value={subForm.payment_terms}
                onChange={(e) => setSubForm({ ...subForm, payment_terms: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              >
                <option value="immediate">Immediate</option>
                <option value="net_15">Net 15 Days</option>
                <option value="net_30">Net 30 Days</option>
                <option value="net_60">Net 60 Days</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes</label>
            <textarea
              rows={2}
              value={subForm.notes}
              onChange={(e) => setSubForm({ ...subForm, notes: e.target.value })}
              placeholder="Internal subscription details..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-blue text-white rounded-xl text-xs font-semibold hover:bg-brand-blue-light transition-all shadow-md"
            >
              Create Subscription
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
