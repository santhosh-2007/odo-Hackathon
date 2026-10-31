import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, Plus, Eye, Building, Mail, Phone } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';

export default function CustomersList() {
  const { role } = useAuth();
  const { success, error } = useToast();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Customer Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [custForm, setCustForm] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    billing_address: '',
    shipping_address: '',
    tax_id: '',
    currency: 'INR',
    password: 'Customer@12345'
  });

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/customers');
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      error('Failed to load customers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCreateModal = () => {
    setCustForm({
      company_name: '',
      contact_name: '',
      email: '',
      phone: '',
      billing_address: '',
      shipping_address: '',
      tax_id: '',
      currency: 'INR',
      password: 'Customer@12345'
    });
    setModalOpen(true);
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/customers', custForm);
      success(res.data.message);
      setModalOpen(false);
      fetchCustomers();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create customer account.');
    }
  };

  const columns = [
    {
      header: 'Customer',
      accessor: 'company_name',
      render: (row) => (
        <div>
          <Link to={`/customers/${row.id}`} className="font-semibold text-brand-blue hover:underline">
            {row.company_name || row.contact_name}
          </Link>
          <span className="block text-xs text-slate-400 font-mono mt-0.5">{row.customer_code}</span>
        </div>
      )
    },
    {
      header: 'Contact Person',
      accessor: 'contact_name',
      render: (row) => (
        <div className="text-xs">
          <p className="font-medium text-slate-800">{row.contact_name}</p>
          <p className="text-slate-500">{row.email}</p>
          {row.phone && <p className="text-slate-400">{row.phone}</p>}
        </div>
      )
    },
    {
      header: 'Active Subscriptions',
      accessor: 'active_subs_count',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
          {row.active_subs_count || 0} active
        </span>
      )
    },
    {
      header: 'Total Invoices',
      accessor: 'total_invoices_count',
      render: (row) => <span className="text-xs font-semibold text-slate-700">{row.total_invoices_count || 0}</span>
    },
    {
      header: 'Outstanding Balance',
      accessor: 'total_outstanding',
      render: (row) => (
        <span className={`text-xs font-bold ${parseFloat(row.total_outstanding) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
          ₹{parseFloat(row.total_outstanding || 0).toFixed(2)}
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
        <Link
          to={`/customers/${row.id}`}
          className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors inline-block"
          title="View Full Profile & Subscriptions"
        >
          <Eye className="w-4 h-4" />
        </Link>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Accounts & CRM</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage subscriber companies, contact profiles, and billing histories
          </p>
        </div>

        {(role === 'admin' || role === 'staff') && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-blue/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={customers}
        loading={loading}
        searchPlaceholder="Search customer company, contact, or email..."
        searchKey="company_name"
      />

      {/* Add Customer Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Add New Customer Account"
        size="lg"
      >
        <form onSubmit={handleCreateCustomer} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Company Name</label>
              <input
                type="text"
                value={custForm.company_name}
                onChange={(e) => setCustForm({ ...custForm, company_name: e.target.value })}
                placeholder="e.g. Zenith Tech Corp"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Contact Person Name *</label>
              <input
                type="text"
                required
                value={custForm.contact_name}
                onChange={(e) => setCustForm({ ...custForm, contact_name: e.target.value })}
                placeholder="e.g. David Miller"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={custForm.email}
                onChange={(e) => setCustForm({ ...custForm, email: e.target.value })}
                placeholder="david@zenith.com"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone Number</label>
              <input
                type="text"
                value={custForm.phone}
                onChange={(e) => setCustForm({ ...custForm, phone: e.target.value })}
                placeholder="+91 98765 00000"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">GSTIN / Tax ID</label>
              <input
                type="text"
                value={custForm.tax_id}
                onChange={(e) => setCustForm({ ...custForm, tax_id: e.target.value.toUpperCase() })}
                placeholder="e.g. 07AABCU9911K1Z3"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Initial Password</label>
              <input
                type="text"
                required
                value={custForm.password}
                onChange={(e) => setCustForm({ ...custForm, password: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Billing Address</label>
            <textarea
              rows={2}
              value={custForm.billing_address}
              onChange={(e) => setCustForm({ ...custForm, billing_address: e.target.value })}
              placeholder="Suite, Street, City, State, PIN"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
            />
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
              Create Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
