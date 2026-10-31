import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Receipt, Eye, Download, CreditCard, Play, Plus, XCircle, Send } from 'lucide-react';
import api, { downloadInvoicePdf } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';

export default function InvoicesList() {
  const { role } = useAuth();
  const { success, error } = useToast();

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [runningBilling, setRunningBilling] = useState(false);

  const handleDownload = async (row) => {
    try {
      await downloadInvoicePdf(row.id, row.invoice_number);
      success(`Downloaded ${row.invoice_number}.pdf`);
    } catch (err) {
      error('Failed to download invoice PDF.');
    }
  };

  // Record Payment Modal State
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [payForm, setPayForm] = useState({
    amount: '',
    payment_method: 'bank_transfer',
    payment_date: new Date().toISOString().split('T')[0],
    transaction_reference: '',
    notes: ''
  });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await api.get('/invoices');
      if (res.data.success) {
        setInvoices(res.data.data);
      }
    } catch (err) {
      error('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleRunBilling = async () => {
    try {
      setRunningBilling(true);
      const res = await api.post('/invoices/trigger-recurring');
      success(res.data.message);
      fetchInvoices();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to execute recurring billing.');
    } finally {
      setRunningBilling(false);
    }
  };

  const openPayModal = (inv) => {
    setSelectedInvoice(inv);
    setPayForm({
      amount: inv.amount_due,
      payment_method: 'bank_transfer',
      payment_date: new Date().toISOString().split('T')[0],
      transaction_reference: `TXN-${Date.now().toString().slice(-6)}`,
      notes: `Settlement for invoice ${inv.invoice_number}`
    });
    setPayModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/payments', {
        invoice_id: selectedInvoice.id,
        amount: payForm.amount,
        payment_method: payForm.payment_method,
        payment_date: payForm.payment_date,
        transaction_reference: payForm.transaction_reference,
        notes: payForm.notes
      });
      success(res.data.message);
      setPayModalOpen(false);
      fetchInvoices();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to record payment.');
    }
  };

  const handleCancelInvoice = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this invoice?')) return;
    try {
      const res = await api.post(`/invoices/${id}/cancel`);
      success(res.data.message);
      fetchInvoices();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to cancel invoice.');
    }
  };

  const handleSendEmail = async (id) => {
    try {
      const res = await api.post(`/invoices/${id}/send-email`);
      success(res.data.message);
    } catch (err) {
      error('Failed to dispatch invoice email.');
    }
  };

  const columns = [
    {
      header: 'Invoice #',
      accessor: 'invoice_number',
      render: (row) => (
        <Link
          to={role === 'customer' ? `/portal/invoices/${row.id}` : `/invoices/${row.id}`}
          className="font-semibold text-brand-blue hover:underline"
        >
          {row.invoice_number}
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
      header: 'Dates',
      accessor: 'invoice_date',
      render: (row) => (
        <div className="text-xs">
          <p className="text-slate-800 font-medium">Issued: {row.invoice_date}</p>
          <p className={`${new Date(row.due_date) < new Date() && row.payment_status !== 'paid' ? 'text-rose-600 font-semibold' : 'text-slate-400'}`}>
            Due: {row.due_date}
          </p>
        </div>
      )
    },
    {
      header: 'Total Amount',
      accessor: 'total_amount',
      render: (row) => (
        <div className="font-bold text-slate-900">
          ₹{parseFloat(row.total_amount).toFixed(2)}
        </div>
      )
    },
    {
      header: 'Balance Due',
      accessor: 'amount_due',
      render: (row) => (
        <div className="text-xs">
          <span className={`font-bold ${parseFloat(row.amount_due) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            ₹{parseFloat(row.amount_due).toFixed(2)}
          </span>
          {parseFloat(row.amount_paid) > 0 && (
            <span className="block text-[11px] text-slate-400">
              Paid: ₹{parseFloat(row.amount_paid).toFixed(2)}
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'payment_status',
      render: (row) => <Badge status={row.payment_status} />
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <Link
            to={role === 'customer' ? `/portal/invoices/${row.id}` : `/invoices/${row.id}`}
            className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
            title="View Invoice"
          >
            <Eye className="w-4 h-4" />
          </Link>

          <button
            onClick={() => handleDownload(row)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>

          {(role === 'admin' || role === 'staff') && (
            <>
              {row.payment_status !== 'paid' && row.payment_status !== 'cancelled' && (
                <button
                  onClick={() => openPayModal(row)}
                  className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                  title="Record Payment"
                >
                  <CreditCard className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => handleSendEmail(row.id)}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Send via Email"
              >
                <Send className="w-4 h-4" />
              </button>

              {row.payment_status === 'unpaid' && (
                <button
                  onClick={() => handleCancelInvoice(row.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Cancel Invoice"
                >
                  <XCircle className="w-4 h-4" />
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invoices & Billing</h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated recurring invoice generation, PDF exports, and payment tracking
          </p>
        </div>

        {(role === 'admin' || role === 'staff') && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunBilling}
              disabled={runningBilling}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-md shadow-slate-900/10 transition-all cursor-pointer disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 fill-white ${runningBilling ? 'animate-spin' : ''}`} />
              <span>{runningBilling ? 'Processing...' : 'Run Billing Engine'}</span>
            </button>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={invoices}
        loading={loading}
        searchPlaceholder="Search invoice #, customer name..."
        searchKey="invoice_number"
        filters={[
          {
            key: 'payment_status',
            label: 'Status',
            options: [
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'partial', label: 'Partial' },
              { value: 'paid', label: 'Paid' },
              { value: 'overdue', label: 'Overdue' },
              { value: 'cancelled', label: 'Cancelled' }
            ]
          }
        ]}
      />

      {/* Record Payment Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={`Record Payment for ${selectedInvoice?.invoice_number}`}
        size="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
            <p><span className="font-semibold">Invoice Total:</span> ₹{parseFloat(selectedInvoice?.total_amount || 0).toFixed(2)}</p>
            <p><span className="font-semibold">Already Paid:</span> ₹{parseFloat(selectedInvoice?.amount_paid || 0).toFixed(2)}</p>
            <p><span className="font-semibold">Current Balance Due:</span> ₹{parseFloat(selectedInvoice?.amount_due || 0).toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Payment Amount (₹) *</label>
            <input
              type="number"
              step="0.01"
              max={selectedInvoice?.amount_due}
              required
              value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold"
            />
            <span className="text-[11px] text-slate-400 mt-0.5 block">Supports partial payments up to the balance due.</span>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Transaction Reference / UTR</label>
            <input
              type="text"
              value={payForm.transaction_reference}
              onChange={(e) => setPayForm({ ...payForm, transaction_reference: e.target.value })}
              placeholder="e.g. UTR-88939210"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes / Remarks</label>
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
              onClick={() => setPayModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-500 transition-all shadow-md"
            >
              Confirm Payment
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
