import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Printer, 
  Download, 
  CreditCard, 
  Send, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';
import api, { downloadInvoicePdf } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';

export default function InvoiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { success, error } = useToast();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Pay Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: '',
    payment_method: 'bank_transfer',
    payment_date: new Date().toISOString().split('T')[0],
    transaction_reference: '',
    notes: ''
  });

  const fetchInvoice = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/invoices/${id}`);
      if (res.data.success) {
        setInvoice(res.data.data);
      }
    } catch (err) {
      error('Failed to load invoice details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const openPayModal = () => {
    setPayForm({
      amount: invoice.amount_due,
      payment_method: 'bank_transfer',
      payment_date: new Date().toISOString().split('T')[0],
      transaction_reference: `TXN-${Date.now().toString().slice(-6)}`,
      notes: `Settlement for invoice ${invoice.invoice_number}`
    });
    setPayModalOpen(true);
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/payments', {
        invoice_id: invoice.id,
        amount: payForm.amount,
        payment_method: payForm.payment_method,
        payment_date: payForm.payment_date,
        transaction_reference: payForm.transaction_reference,
        notes: payForm.notes
      });
      success(res.data.message);
      setPayModalOpen(false);
      fetchInvoice();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to record payment.');
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloading(true);
      await downloadInvoicePdf(invoice.id, invoice.invoice_number);
      success('Invoice PDF downloaded successfully!');
    } catch (err) {
      error('Failed to download invoice PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleSendEmail = async () => {
    try {
      const res = await api.post(`/invoices/${id}/send-email`);
      success(res.data.message);
    } catch (err) {
      error('Failed to dispatch invoice email.');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 animate-pulse">
        Loading invoice document...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-8 text-center text-slate-500">
        Invoice document not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Invoices</span>
        </button>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors cursor-pointer disabled:opacity-50"
            title="Download PDF Document"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{downloading ? 'Downloading...' : 'Download PDF'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print</span>
          </button>

          {(role === 'admin' || role === 'staff') && (
            <>
              <button
                onClick={handleSendEmail}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
              >
                <Send className="w-4 h-4 text-indigo-500" />
                <span>Email Client</span>
              </button>

              {invoice.payment_status !== 'paid' && invoice.payment_status !== 'cancelled' && (
                <button
                  onClick={openPayModal}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Record Payment</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Official Tax Invoice Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:shadow-none print:border-none">
        {/* Dark Navy Header Banner */}
        <div className="bg-navy-900 text-white p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">BRIGHTLOOP SOFTWARE</h2>
            <p className="text-xs text-slate-300 mt-1">Enterprise SaaS & Subscription Cloud Platform</p>
            <p className="text-[11px] text-slate-400 mt-0.5">GSTIN: 07AABCB9921M1Z1 | contact@brightloop.com</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Official Tax Invoice</span>
            <span className="text-xl font-mono font-bold text-white">{invoice.invoice_number}</span>
            <div className="mt-2">
              <Badge status={invoice.payment_status} />
            </div>
          </div>
        </div>

        {/* Invoice Metadata & Customer Info */}
        <div className="p-8 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</p>
            <h4 className="text-base font-bold text-slate-900">{invoice.company_name || invoice.contact_name}</h4>
            <p className="text-xs text-slate-600 mt-1">Attn: {invoice.contact_name}</p>
            <p className="text-xs text-slate-500">{invoice.email}</p>
            {invoice.phone && <p className="text-xs text-slate-500">{invoice.phone}</p>}
            {invoice.billing_address && <p className="text-xs text-slate-500 mt-1">{invoice.billing_address}</p>}
            {invoice.customer_tax_id && (
              <p className="text-xs font-mono text-slate-600 mt-1">GSTIN: {invoice.customer_tax_id}</p>
            )}
          </div>

          <div className="sm:text-right space-y-1.5 text-xs text-slate-600">
            <p><span className="font-semibold text-slate-800">Invoice Date:</span> {invoice.invoice_date}</p>
            <p><span className="font-semibold text-slate-800">Due Date:</span> {invoice.due_date}</p>
            {invoice.subscription_number && (
              <p><span className="font-semibold text-slate-800">Subscription Ref:</span> {invoice.subscription_number}</p>
            )}
            {invoice.billing_period_start && invoice.billing_period_end && (
              <p><span className="font-semibold text-slate-800">Billing Period:</span> {invoice.billing_period_start} to {invoice.billing_period_end}</p>
            )}
          </div>
        </div>

        {/* Lines Table */}
        <div className="p-8">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="pb-3">Item Description</th>
                <th className="pb-3 text-right">Qty</th>
                <th className="pb-3 text-right">Unit Price</th>
                <th className="pb-3 text-right">Tax (%)</th>
                <th className="pb-3 text-right">Total (INR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoice.lines && invoice.lines.map((line, idx) => (
                <tr key={idx} className="py-3">
                  <td className="py-3.5 pr-4">
                    <p className="font-semibold text-slate-900">{line.product_name || 'Subscription Line'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{line.description}</p>
                    {line.variant_name && <span className="text-[11px] text-brand-blue font-medium">{line.variant_name}</span>}
                  </td>
                  <td className="py-3.5 text-right font-medium text-slate-700">{line.quantity}</td>
                  <td className="py-3.5 text-right font-medium text-slate-700">₹{parseFloat(line.unit_price).toFixed(2)}</td>
                  <td className="py-3.5 text-right text-slate-600">₹{parseFloat(line.tax_amount || 0).toFixed(2)} ({line.tax_rate}%)</td>
                  <td className="py-3.5 text-right font-bold text-slate-900">₹{parseFloat(line.line_total).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div className="max-w-md text-xs text-slate-500 space-y-1.5">
              <p className="font-bold text-slate-700 uppercase tracking-wider">Bank & Remittance Details</p>
              <p>Account Name: Brightloop Software Private Limited</p>
              <p>Account Number: 50200088992211 (HDFC Bank Current A/C)</p>
              <p>IFSC: HDFC0001234 • UPI ID: brightloop@hdfcbank</p>
              {invoice.notes && <p className="mt-2 text-slate-600 italic">{invoice.notes}</p>}
            </div>

            <div className="w-full sm:w-80 bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{parseFloat(invoice.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax Amount (GST):</span>
                <span className="font-semibold">₹{parseFloat(invoice.tax_amount).toFixed(2)}</span>
              </div>
              {parseFloat(invoice.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Discount Applied:</span>
                  <span>- ₹{parseFloat(invoice.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Amount:</span>
                <span>₹{parseFloat(invoice.total_amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700 font-semibold">
                <span>Paid to Date:</span>
                <span>₹{parseFloat(invoice.amount_paid).toFixed(2)}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 flex justify-between text-sm font-bold text-rose-600">
                <span>Remaining Balance Due:</span>
                <span className="text-base">₹{parseFloat(invoice.amount_due).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Payment History Table for this Invoice */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="mt-8 pt-6 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Recorded Payments</h4>
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 font-semibold text-slate-500 uppercase border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2">Payment ID</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2">Method</th>
                      <th className="px-4 py-2">Reference</th>
                      <th className="px-4 py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoice.payments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-2.5 font-mono text-slate-700">{p.payment_number}</td>
                        <td className="px-4 py-2.5 text-slate-600">{p.payment_date}</td>
                        <td className="px-4 py-2.5 capitalize text-slate-600">{p.payment_method.replace('_', ' ')}</td>
                        <td className="px-4 py-2.5 font-mono text-slate-500">{p.transaction_reference}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-700">₹{parseFloat(p.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
          This is a verified computer-generated Tax Invoice issued by Brightloop Software Private Limited.
        </div>
      </div>

      {/* Record Payment Modal */}
      <Modal
        isOpen={payModalOpen}
        onClose={() => setPayModalOpen(false)}
        title={`Record Payment for ${invoice.invoice_number}`}
        size="md"
      >
        <form onSubmit={handleRecordPayment} className="space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-1">
            <p><span className="font-semibold">Invoice Total:</span> ₹{parseFloat(invoice.total_amount).toFixed(2)}</p>
            <p><span className="font-semibold">Current Balance Due:</span> ₹{parseFloat(invoice.amount_due).toFixed(2)}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Amount to Record (₹) *</label>
            <input
              type="number"
              step="0.01"
              max={invoice.amount_due}
              required
              value={payForm.amount}
              onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Method</label>
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
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Date</label>
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
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Transaction Ref</label>
            <input
              type="text"
              value={payForm.transaction_reference}
              onChange={(e) => setPayForm({ ...payForm, transaction_reference: e.target.value })}
              placeholder="e.g. UTR-998822"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono"
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
              Confirm Settlement
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
