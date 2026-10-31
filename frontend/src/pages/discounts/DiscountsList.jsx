import React, { useState, useEffect } from 'react';
import { Percent, Plus, Edit2, Trash2, Tag, CheckCircle2, Sparkles } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';

export default function DiscountsList() {
  const { role } = useAuth();
  const { success, error, info } = useToast();

  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [discountForm, setDiscountForm] = useState({
    code: '',
    name: '',
    discount_type: 'percentage',
    discount_value: '',
    min_purchase_amount: '0',
    min_quantity: '1',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    max_usage_count: '100',
    status: 'active'
  });

  // Sandbox Tester State
  const [testCode, setTestCode] = useState('WELCOME10');
  const [testAmount, setTestAmount] = useState('2000');
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/discounts');
      if (res.data.success) {
        setDiscounts(res.data.data);
      }
    } catch (err) {
      error('Failed to load discounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const openCreateModal = () => {
    setEditingDiscount(null);
    setDiscountForm({
      code: '',
      name: '',
      discount_type: 'percentage',
      discount_value: '10.00',
      min_purchase_amount: '500',
      min_quantity: '1',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '2026-12-31',
      max_usage_count: '100',
      status: 'active'
    });
    setModalOpen(true);
  };

  const openEditModal = (d) => {
    setEditingDiscount(d);
    setDiscountForm({
      code: d.code,
      name: d.name,
      discount_type: d.discount_type,
      discount_value: d.discount_value,
      min_purchase_amount: d.min_purchase_amount,
      min_quantity: d.min_quantity,
      start_date: d.start_date,
      end_date: d.end_date || '',
      max_usage_count: d.max_usage_count,
      status: d.status
    });
    setModalOpen(true);
  };

  const handleSaveDiscount = async (e) => {
    e.preventDefault();
    try {
      if (editingDiscount) {
        await api.put(`/discounts/${editingDiscount.id}`, discountForm);
        success('Discount rule updated successfully!');
      } else {
        await api.post('/discounts', discountForm);
        success('Discount rule created successfully!');
      }
      setModalOpen(false);
      fetchDiscounts();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save discount rule.');
    }
  };

  const handleDeleteDiscount = async (id) => {
    if (!window.confirm('Deactivate this discount rule?')) return;
    try {
      await api.delete(`/discounts/${id}`);
      success('Discount rule deactivated.');
      fetchDiscounts();
    } catch (err) {
      error('Failed to deactivate discount rule.');
    }
  };

  // Test discount sandbox
  const handleTestDiscount = async (e) => {
    e.preventDefault();
    try {
      setTesting(true);
      const res = await api.post('/discounts/validate', {
        code: testCode,
        purchase_amount: testAmount,
        quantity: 1
      });
      setTestResult(res.data);
      success(res.data.message);
    } catch (err) {
      setTestResult(null);
      error(err.response?.data?.message || 'Discount validation rejected.');
    } finally {
      setTesting(false);
    }
  };

  const columns = [
    {
      header: 'Coupon Code',
      accessor: 'code',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-brand-purple bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-200">
            {row.code}
          </span>
          <span className="block text-xs text-slate-700 font-medium mt-1">{row.name}</span>
        </div>
      )
    },
    {
      header: 'Discount Benefit',
      accessor: 'discount_value',
      render: (row) => (
        <div className="font-bold text-slate-900">
          {row.discount_type === 'percentage' 
            ? `${parseFloat(row.discount_value).toFixed(0)}% Off` 
            : `₹${parseFloat(row.discount_value).toFixed(2)} Flat`}
        </div>
      )
    },
    {
      header: 'Eligibility Criteria',
      render: (row) => (
        <div className="text-xs text-slate-600 space-y-0.5">
          <p>Min Purchase: <span className="font-semibold text-slate-800">₹{parseFloat(row.min_purchase_amount).toFixed(2)}</span></p>
          <p>Min Quantity: <span className="font-semibold text-slate-800">{row.min_quantity} item(s)</span></p>
        </div>
      )
    },
    {
      header: 'Redemptions',
      render: (row) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800">{row.current_usage_count}</span>
          <span className="text-slate-400"> / {row.max_usage_count} max</span>
          <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-brand-purple h-1.5 rounded-full"
              style={{ width: `${Math.min(100, (row.current_usage_count / row.max_usage_count) * 100)}%` }}
            ></div>
          </div>
        </div>
      )
    },
    {
      header: 'Validity Period',
      render: (row) => (
        <div className="text-xs text-slate-600">
          <p>Start: {row.start_date}</p>
          <p>End: {row.end_date || 'No Expiry'}</p>
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
          {role === 'admin' && (
            <>
              <button
                onClick={() => openEditModal(row)}
                className="p-1.5 text-slate-400 hover:text-brand-purple hover:bg-purple-50 rounded-lg transition-colors"
                title="Edit Discount Rule"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteDiscount(row.id)}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Deactivate"
              >
                <Trash2 className="w-4 h-4" />
              </button>
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Discounts & Coupon Rules</h1>
          <p className="text-sm text-slate-500 mt-1">
            Administer percentage and fixed promotional discounts, eligibility terms, and usage bounds
          </p>
        </div>

        {role === 'admin' && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-purple hover:bg-brand-purple-light text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-purple/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Discount Rule</span>
          </button>
        )}
      </div>

      {/* Discount Tester Sandbox */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-brand-purple" />
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Coupon Validation Simulator</h3>
        </div>
        <form onSubmit={handleTestDiscount} className="flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            required
            value={testCode}
            onChange={(e) => setTestCode(e.target.value.toUpperCase())}
            placeholder="Coupon Code"
            className="w-full sm:w-48 px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs font-mono font-bold uppercase"
          />
          <input
            type="number"
            step="0.01"
            required
            value={testAmount}
            onChange={(e) => setTestAmount(e.target.value)}
            placeholder="Purchase Amount (₹)"
            className="w-full sm:w-44 px-3 py-2 bg-white border border-purple-200 rounded-xl text-xs"
          />
          <button
            type="submit"
            disabled={testing}
            className="w-full sm:w-auto px-4 py-2 bg-brand-purple hover:bg-brand-purple-light text-white rounded-xl text-xs font-semibold transition-all shadow-sm"
          >
            {testing ? 'Verifying...' : 'Test Eligibility'}
          </button>

          {testResult && testResult.data && (
            <div className="text-xs font-semibold text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-3 py-2 rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Verified: Saves ₹{parseFloat(testResult.data.calculated_savings).toFixed(2)}!</span>
            </div>
          )}
        </form>
      </div>

      <DataTable
        columns={columns}
        data={discounts}
        loading={loading}
        searchPlaceholder="Search discount code or campaign..."
        searchKey="code"
      />

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDiscount ? 'Edit Discount Rule' : 'Create New Discount Rule'}
        size="md"
      >
        <form onSubmit={handleSaveDiscount} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Coupon Code *</label>
              <input
                type="text"
                required
                value={discountForm.code}
                onChange={(e) => setDiscountForm({ ...discountForm, code: e.target.value.toUpperCase() })}
                placeholder="e.g. WELCOME10"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono font-bold uppercase"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Campaign Name *</label>
              <input
                type="text"
                required
                value={discountForm.name}
                onChange={(e) => setDiscountForm({ ...discountForm, name: e.target.value })}
                placeholder="e.g. Welcome Promo"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Discount Type</label>
              <select
                value={discountForm.discount_type}
                onChange={(e) => setDiscountForm({ ...discountForm, discount_type: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              >
                <option value="percentage">Percentage (%) Discount</option>
                <option value="fixed">Fixed Amount (₹) Discount</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Discount Value *</label>
              <input
                type="number"
                step="0.01"
                required
                value={discountForm.discount_value}
                onChange={(e) => setDiscountForm({ ...discountForm, discount_value: e.target.value })}
                placeholder="10.00"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Min Purchase (₹)</label>
              <input
                type="number"
                step="0.01"
                value={discountForm.min_purchase_amount}
                onChange={(e) => setDiscountForm({ ...discountForm, min_purchase_amount: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Min Qty</label>
              <input
                type="number"
                min="1"
                value={discountForm.min_quantity}
                onChange={(e) => setDiscountForm({ ...discountForm, min_quantity: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Max Usages</label>
              <input
                type="number"
                min="1"
                value={discountForm.max_usage_count}
                onChange={(e) => setDiscountForm({ ...discountForm, max_usage_count: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Start Date</label>
              <input
                type="date"
                required
                value={discountForm.start_date}
                onChange={(e) => setDiscountForm({ ...discountForm, start_date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Expiry Date</label>
              <input
                type="date"
                value={discountForm.end_date}
                onChange={(e) => setDiscountForm({ ...discountForm, end_date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-purple text-white rounded-xl text-xs font-semibold hover:bg-brand-purple-light transition-all shadow-md"
            >
              Save Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
