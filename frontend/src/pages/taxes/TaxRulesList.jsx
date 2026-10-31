import React, { useState, useEffect } from 'react';
import { Calculator, Plus, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';

export default function TaxRulesList() {
  const { role } = useAuth();
  const { success, error } = useToast();

  const [taxes, setTaxes] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState(null);
  const [taxForm, setTaxForm] = useState({
    name: '',
    percentage: '',
    tax_type: 'exclusive',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'active'
  });

  const fetchTaxes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/taxes');
      if (res.data.success) {
        setTaxes(res.data.data);
      }
    } catch (err) {
      error('Failed to load tax rules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxes();
  }, []);

  const openCreateModal = () => {
    setEditingTax(null);
    setTaxForm({
      name: '',
      percentage: '18.00',
      tax_type: 'exclusive',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      status: 'active'
    });
    setModalOpen(true);
  };

  const openEditModal = (t) => {
    setEditingTax(t);
    setTaxForm({
      name: t.name,
      percentage: t.percentage,
      tax_type: t.tax_type,
      start_date: t.start_date,
      end_date: t.end_date || '',
      status: t.status
    });
    setModalOpen(true);
  };

  const handleSaveTax = async (e) => {
    e.preventDefault();
    try {
      if (editingTax) {
        await api.put(`/taxes/${editingTax.id}`, taxForm);
        success('Tax rule updated successfully!');
      } else {
        await api.post('/taxes', taxForm);
        success('Tax rule created successfully!');
      }
      setModalOpen(false);
      fetchTaxes();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save tax rule.');
    }
  };

  const handleDeleteTax = async (id) => {
    if (!window.confirm('Deactivate this tax rule?')) return;
    try {
      await api.delete(`/taxes/${id}`);
      success('Tax rule deactivated.');
      fetchTaxes();
    } catch (err) {
      error('Failed to deactivate tax rule.');
    }
  };

  const columns = [
    {
      header: 'Tax Rule Name',
      accessor: 'name',
      render: (row) => <span className="font-semibold text-slate-900">{row.name}</span>
    },
    {
      header: 'Percentage Rate',
      accessor: 'percentage',
      render: (row) => (
        <span className="font-bold text-brand-blue text-sm">{parseFloat(row.percentage).toFixed(2)}%</span>
      )
    },
    {
      header: 'Tax Calculation Type',
      accessor: 'tax_type',
      render: (row) => (
        <span className="capitalize text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
          {row.tax_type}
        </span>
      )
    },
    {
      header: 'Effective Date',
      accessor: 'start_date',
      render: (row) => (
        <span className="text-xs text-slate-600">
          From {row.start_date} {row.end_date ? `to ${row.end_date}` : '(Ongoing)'}
        </span>
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
                className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Tax Rule"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteTax(row.id)}
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tax Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure jurisdictional tax rules (GST, VAT) for automated invoice calculations
          </p>
        </div>

        {role === 'admin' && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-blue/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Tax Rule</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={taxes}
        loading={loading}
        searchPlaceholder="Search tax rules..."
        searchKey="name"
      />

      {/* Tax Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTax ? 'Edit Tax Rule' : 'Create Tax Rule'}
        size="md"
      >
        <form onSubmit={handleSaveTax} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Rule Name *</label>
            <input
              type="text"
              required
              value={taxForm.name}
              onChange={(e) => setTaxForm({ ...taxForm, name: e.target.value })}
              placeholder="e.g. Standard GST 18%"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Percentage (%) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={taxForm.percentage}
                onChange={(e) => setTaxForm({ ...taxForm, percentage: e.target.value })}
                placeholder="18.00"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Tax Type</label>
              <select
                value={taxForm.tax_type}
                onChange={(e) => setTaxForm({ ...taxForm, tax_type: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              >
                <option value="exclusive">Exclusive (Added to subtotal)</option>
                <option value="inclusive">Inclusive (Included in price)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Start Date</label>
              <input
                type="date"
                required
                value={taxForm.start_date}
                onChange={(e) => setTaxForm({ ...taxForm, start_date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Status</label>
              <select
                value={taxForm.status}
                onChange={(e) => setTaxForm({ ...taxForm, status: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
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
              className="px-5 py-2 bg-brand-blue text-white rounded-xl text-xs font-semibold hover:bg-brand-blue-light transition-all shadow-md"
            >
              Save Tax Rule
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
