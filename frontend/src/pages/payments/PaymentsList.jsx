import React, { useState, useEffect } from 'react';
import { CreditCard, Plus, Eye, Download, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';

export default function PaymentsList() {
  const { role } = useAuth();
  const { success, error } = useToast();

  const [payments, setPayments] = useState([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Record Payment Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    invoice_id: '',
    amount: '',
    payment_method: 'bank_transfer',
    payment_date: new Date().toISOString().split('T')[0],
    transaction_reference: '',
    notes: ''
  });

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const [payRes, invRes] = await Promise.all([
        api.get('/payments'),
        role !== 'customer' ? api.get('/invoices?status=unpaid') : Promise.resolve({ data: { success: true, data: [] } })
      ]);

      if (payRes.data.success) setPayments(payRes.data.data);
      if (invRes.data.success) setUnpaidInvoices(invRes.data.data);
    } catch (err) {
      error('Failed to load payment transactions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const openNewPayment = () => {
    setPayForm({
      invoice_id: unpaidInvoices[0]?.id || '',
      amount: unpaidInvoices[0]?.amount_due || '',
      payment_method: 'bank_transfer',
      payment_date: new Date().toISOString().split('T')[0],
      transaction_reference: `TXN-${Date.now().toString().slice(-6)}`,
      notes: ''
    });
    setModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/payments', payForm);
      success(res.data.message);
      setModalOpen(false);
      fetchPayments();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to record payment.');
    }
  };

  const columns = [
    {
      header: 'Payment ID',
      accessor: 'payment_number',
      render: (row) => (
        <span className="font-mono font-semibold text-slate-900">{row.payment_number}</span>
      )
    },
    {
      header: 'Invoice #',
      accessor: 'invoice_number',
      render: (row) => (
        <span className="font-semibold text-brand-blue">{row.invoice_number}</span>
      )
    },
    {
      header: 'Customer',
      accessor: 'company_name',
      render: (row) => (
        <div>
          <span className="font-medium text-slate-800">{row.company_name || row.contact_name}</span>
          <span className="block text-xs text-slate-400 font-mono">{row.customer_code}</span>
        </div>
      )
    },
    {
      header: 'Method',
      accessor: 'payment_method',
      render: (row) => (
        <span className="capitalize text-xs font-medium text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
          {row.payment_method.replace('_', ' ')}
        </span>
      )
    },
    {
      header: 'Transaction Ref',
      accessor: 'transaction_reference',
      render: (row) => (
        <span className="font-mono text-xs text-slate-600">{row.transaction_reference || 'N/A'}</span>
      )
    },
    {
      header: 'Date',
      accessor: 'payment_date',
      render: (row) => <span className="text-xs text-slate-600">{row.payment_date}</span>
    },
    {
      header: 'Amount Paid',
      accessor: 'amount',
      render: (row) => (
        <span className="font-bold text-emerald-600">₹{parseFloat(row.amount).toFixed(2)}</span>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (row) => <Badge status={row.status} />
    }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payments & Collections</h1>
          <p className="text-sm text-slate-500 mt-1">
            Track verified bank transfers, UPI transactions, credit cards, and partial settlements
          </p>
        </div>

        {(role === 'admin' || role === 'staff') && (
          <button
            onClick={openNewPayment}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={payments}
        loading={loading}
        searchPlaceholder="Search payment ID, transaction reference, invoice..."
        searchKey="payment_number"
        filters={[
          {
            key: 'payment_method',
            label: 'Method',
            options: [
              { value: 'upi', label: 'UPI' },
              { value: 'bank_transfer', label: 'Bank Transfer' },
              { value: 'credit_card', label: 'Credit Card' },
              { value: 'debit_card', label: 'Debit Card' },
              { value: 'cash', label: 'Cash' }
            ]
          }
        ]}
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Incoming Payment"
        size="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Invoice to Settle *</label>
            <select
              required
              value={payForm.invoice_id}
              onChange={(e) => {
                const inv = unpaidInvoices.find((i) => String(i.id) === String(e.target.value));
                setPayForm({
                  ...payForm,
                  invoice_id: e.target.value,
                  amount: inv ? inv.amount_due : ''
                });
              }}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
            >
              <option value="">Select Invoice</option>
              {unpaidInvoices.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.invoice_number} — {inv.company_name || inv.contact_name} (Due: ₹{parseFloat(inv.amount_due).toFixed(2)})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Amount (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={payForm.amount}
                onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Date</label>
              <input
                type="date"
                required
                value={payForm.payment_date}
                onChange={(e) => setPayForm({ ...payForm, payment_date: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Method</label>
              <select
                value={payForm.payment_method}
                onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              >
                <option value="bank_transfer">Bank Transfer / NEFT</option>
                <option value="upi">UPI (GPay / PhonePe / Paytm)</option>
                <option value="credit_card">Credit Card</option>
                <option value="debit_card">Debit Card</option>
                <option value="cash">Cash Settlement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Transaction Ref / UTR</label>
              <input
                type="text"
                value={payForm.transaction_reference}
                onChange={(e) => setPayForm({ ...payForm, transaction_reference: e.target.value })}
                placeholder="e.g. UTR-8829103"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes</label>
            <input
              type="text"
              value={payForm.notes}
              onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })}
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
              className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-500 transition-all shadow-md"
            >
              Confirm Settlement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
