import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, Trash2, Calendar, Check, X } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';

export default function PlansList() {
  const { role } = useAuth();
  const { success, error } = useToast();

  const [plans, setPlans] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({
    plan_code: '',
    name: '',
    product_id: '',
    variant_id: '',
    price: '',
    billing_frequency: 'monthly',
    min_quantity: '1',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    auto_close: false,
    early_closure_allowed: true,
    pause_allowed: true,
    renewal_allowed: true,
    description: '',
    status: 'active'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [plansRes, prodsRes] = await Promise.all([
        api.get('/plans'),
        api.get('/products')
      ]);
      if (plansRes.data.success) setPlans(plansRes.data.data);
      if (prodsRes.data.success) setProducts(prodsRes.data.data);
    } catch (err) {
      error('Failed to load subscription plans.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingPlan(null);
    setPlanForm({
      plan_code: `PLAN-${Date.now().toString().slice(-4)}`,
      name: '',
      product_id: products[0]?.id || '',
      variant_id: '',
      price: '',
      billing_frequency: 'monthly',
      min_quantity: '1',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      auto_close: false,
      early_closure_allowed: true,
      pause_allowed: true,
      renewal_allowed: true,
      description: '',
      status: 'active'
    });
    setPlanModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingPlan(p);
    setPlanForm({
      plan_code: p.plan_code,
      name: p.name,
      product_id: p.product_id,
      variant_id: p.variant_id || '',
      price: p.price,
      billing_frequency: p.billing_frequency,
      min_quantity: p.min_quantity,
      start_date: p.start_date,
      end_date: p.end_date || '',
      auto_close: !!p.auto_close,
      early_closure_allowed: !!p.early_closure_allowed,
      pause_allowed: !!p.pause_allowed,
      renewal_allowed: !!p.renewal_allowed,
      description: p.description || '',
      status: p.status
    });
    setPlanModalOpen(true);
  };

  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      if (editingPlan) {
        await api.put(`/plans/${editingPlan.id}`, planForm);
        success('Subscription plan updated successfully!');
      } else {
        await api.post('/plans', planForm);
        success('Subscription plan created successfully!');
      }
      setPlanModalOpen(false);
      fetchData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save subscription plan.');
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Delete or archive plan? Active subscriptions using this plan will remain safe.')) return;
    try {
      const res = await api.delete(`/plans/${id}`);
      success(res.data.message);
      fetchData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete plan.');
    }
  };

  // Filter variants for currently selected product in modal
  const selectedProduct = products.find((p) => String(p.id) === String(planForm.product_id));
  const availableVariants = selectedProduct?.variants || [];

  const columns = [
    {
      header: 'Plan Name',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.name}</div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">{row.plan_code}</div>
        </div>
      )
    },
    {
      header: 'Product / Variant',
      accessor: 'product_name',
      render: (row) => (
        <div>
          <span className="font-medium text-slate-800">{row.product_name}</span>
          {row.variant_name && (
            <span className="block text-xs text-brand-blue font-semibold">{row.variant_name}</span>
          )}
        </div>
      )
    },
    {
      header: 'Frequency',
      accessor: 'billing_frequency',
      render: (row) => <Badge status={row.billing_frequency} />
    },
    {
      header: 'Price / Cycle',
      accessor: 'price',
      render: (row) => (
        <div className="font-bold text-slate-900">
          ₹{parseFloat(row.price).toFixed(2)}
          <span className="text-xs text-slate-400 font-normal"> / {row.billing_frequency}</span>
        </div>
      )
    },
    {
      header: 'Rules & Permissions',
      render: (row) => (
        <div className="flex flex-wrap gap-1 text-[11px]">
          {row.pause_allowed ? (
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700">Pauseable</span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 line-through">Pause</span>
          )}
          {row.early_closure_allowed ? (
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">Early Close</span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-medium">Locked Term</span>
          )}
          {row.auto_close ? (
            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700">Auto Close</span>
          ) : null}
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
        <div className="flex items-center gap-2">
          {(role === 'admin' || role === 'staff') && (
            <button
              onClick={() => openEditModal(row)}
              className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit Plan"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {role === 'admin' && (
            <button
              onClick={() => handleDeletePlan(row.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete or Archive Plan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Subscription Plans</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure recurring billing intervals, pricing models, and plan lifecycle policies
          </p>
        </div>

        {(role === 'admin' || role === 'staff') && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-blue/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Plan</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={plans}
        loading={loading}
        searchPlaceholder="Search plans by name or code..."
        searchKey="name"
        filters={[
          {
            key: 'billing_frequency',
            label: 'Frequency',
            options: [
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' }
            ]
          },
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'archived', label: 'Archived' }
            ]
          }
        ]}
      />

      {/* Plan Form Modal */}
      <Modal
        isOpen={planModalOpen}
        onClose={() => setPlanModalOpen(false)}
        title={editingPlan ? 'Edit Subscription Plan' : 'Configure New Subscription Plan'}
        size="lg"
      >
        <form onSubmit={handleSavePlan} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Plan Code</label>
              <input
                type="text"
                required
                value={planForm.plan_code}
                onChange={(e) => setPlanForm({ ...planForm, plan_code: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Plan Name *</label>
              <input
                type="text"
                required
                value={planForm.name}
                onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                placeholder="e.g. ERP Odoo Edition Monthly"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Related Product *</label>
              <select
                required
                value={planForm.product_id}
                onChange={(e) => setPlanForm({ ...planForm, product_id: e.target.value, variant_id: '' })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              >
                <option value="">Select Base Product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} (₹{parseFloat(p.sales_price).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Product Variant</label>
              <select
                value={planForm.variant_id}
                onChange={(e) => setPlanForm({ ...planForm, variant_id: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              >
                <option value="">Base Product Default</option>
                {availableVariants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.variant_name} (+₹{parseFloat(v.additional_price).toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Plan Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={planForm.price}
                onChange={(e) => setPlanForm({ ...planForm, price: e.target.value })}
                placeholder="1560.00"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Billing Frequency *</label>
              <select
                value={planForm.billing_frequency}
                onChange={(e) => setPlanForm({ ...planForm, billing_frequency: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm capitalize"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Min Quantity</label>
              <input
                type="number"
                min="1"
                value={planForm.min_quantity}
                onChange={(e) => setPlanForm({ ...planForm, min_quantity: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Plan Rules Checkboxes */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Plan Policy Rules</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={planForm.early_closure_allowed}
                  onChange={(e) => setPlanForm({ ...planForm, early_closure_allowed: e.target.checked })}
                  className="rounded text-brand-blue"
                />
                <span className="text-slate-700">Early Closure Allowed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={planForm.pause_allowed}
                  onChange={(e) => setPlanForm({ ...planForm, pause_allowed: e.target.checked })}
                  className="rounded text-brand-blue"
                />
                <span className="text-slate-700">Pause Subscription Allowed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={planForm.renewal_allowed}
                  onChange={(e) => setPlanForm({ ...planForm, renewal_allowed: e.target.checked })}
                  className="rounded text-brand-blue"
                />
                <span className="text-slate-700">Term Renewal Allowed</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={planForm.auto_close}
                  onChange={(e) => setPlanForm({ ...planForm, auto_close: e.target.checked })}
                  className="rounded text-brand-blue"
                />
                <span className="text-slate-700">Auto Close at Expiry</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Plan Description</label>
            <textarea
              rows={2}
              value={planForm.description}
              onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setPlanModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-blue text-white rounded-xl text-xs font-semibold hover:bg-brand-blue-light transition-all shadow-md"
            >
              {editingPlan ? 'Save Changes' : 'Create Plan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
