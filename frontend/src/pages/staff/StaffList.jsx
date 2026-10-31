import React, { useState, useEffect } from 'react';
import { ShieldCheck, Plus, Edit2, Trash2, Mail, Phone, Building } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';

export default function StaffList() {
  const { role } = useAuth();
  const { success, error } = useToast();

  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: 'Staff@12345',
    department: 'Customer Operations',
    designation: 'Subscription Specialist',
    phone: ''
  });

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get('/staff');
      if (res.data.success) {
        setStaff(res.data.data);
      }
    } catch (err) {
      error('Failed to load staff accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const openCreateModal = () => {
    setStaffForm({
      name: '',
      email: '',
      password: 'Staff@12345',
      department: 'Customer Operations',
      designation: 'Subscription Specialist',
      phone: ''
    });
    setModalOpen(true);
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/staff', staffForm);
      success(res.data.message);
      setModalOpen(false);
      fetchStaff();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create staff account.');
    }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deactivate this staff account?')) return;
    try {
      const res = await api.delete(`/staff/${id}`);
      success(res.data.message);
      fetchStaff();
    } catch (err) {
      error('Failed to deactivate staff member.');
    }
  };

  const columns = [
    {
      header: 'Staff Member',
      accessor: 'name',
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900">{row.name}</span>
          <span className="block text-xs text-slate-400 font-mono mt-0.5">{row.employee_code}</span>
        </div>
      )
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => (
        <div>
          <span className="text-xs font-semibold text-slate-800">{row.department}</span>
          <span className="block text-[11px] text-slate-500">{row.designation}</span>
        </div>
      )
    },
    {
      header: 'Email & Contact',
      accessor: 'email',
      render: (row) => (
        <div className="text-xs">
          <p className="text-slate-800">{row.email}</p>
          <p className="text-slate-400">{row.phone || 'N/A'}</p>
        </div>
      )
    },
    {
      header: 'Joined Date',
      accessor: 'joined_date',
      render: (row) => <span className="text-xs text-slate-600">{row.joined_date?.slice(0, 10)}</span>
    },
    {
      header: 'Account Status',
      accessor: 'user_status',
      render: (row) => <Badge status={row.user_status} />
    },
    {
      header: 'Actions',
      render: (row) => (
        <button
          onClick={() => handleDeactivate(row.id)}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          title="Deactivate Staff Account"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Staff & Team Permissions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Administer internal Brightloop staff accounts and operational roles
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-blue/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Create Staff Account</span>
        </button>
      </div>

      <DataTable
        columns={columns}
        data={staff}
        loading={loading}
        searchPlaceholder="Search staff by name or code..."
        searchKey="name"
      />

      {/* Create Staff Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Create New Staff Member Account"
        size="md"
      >
        <form onSubmit={handleCreateStaff} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={staffForm.name}
              onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
              placeholder="e.g. Marcus Bradley"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Email *</label>
              <input
                type="email"
                required
                value={staffForm.email}
                onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                placeholder="marcus@brightloop.com"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Phone</label>
              <input
                type="text"
                value={staffForm.phone}
                onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                placeholder="+91 98765 00000"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Department</label>
              <select
                value={staffForm.department}
                onChange={(e) => setStaffForm({ ...staffForm, department: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              >
                <option value="Customer Operations">Customer Operations</option>
                <option value="Billing & Finance">Billing & Finance</option>
                <option value="Technical Support">Technical Support</option>
                <option value="Customer Success">Customer Success</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Designation</label>
              <input
                type="text"
                required
                value={staffForm.designation}
                onChange={(e) => setStaffForm({ ...staffForm, designation: e.target.value })}
                placeholder="e.g. Senior Billing Specialist"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Initial Password *</label>
            <input
              type="text"
              required
              value={staffForm.password}
              onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Must be &gt; 8 characters with 1 uppercase, 1 lowercase, and 1 special symbol.
            </span>
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
              Create Staff Account
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
