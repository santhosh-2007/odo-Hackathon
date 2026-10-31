import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Printer, RefreshCw, CheckCircle2, XCircle, ArrowLeft, Building, Mail, Phone } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/Badge';

export default function QuotationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { role, user } = useAuth();
  const { success, error } = useToast();

  const [quotation, setQuotation] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchQuotation = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/quotations/${id}`);
      if (res.data.success) {
        setQuotation(res.data.data);
      }
    } catch (err) {
      error('Failed to load quotation details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotation();
  }, [id]);

  const handleRespond = async (action) => {
    try {
      const res = await api.post(`/quotations/${id}/respond`, { action });
      success(res.data.message);
      fetchQuotation();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to update quotation response.');
    }
  };

  const handleConvert = async () => {
    if (!window.confirm('Convert this quotation directly into an active subscription?')) return;
    try {
      const res = await api.post(`/quotations/${id}/convert`, {
        payment_terms: 'immediate',
        start_date: new Date().toISOString().split('T')[0]
      });
      success(res.data.message);
      navigate(`/subscriptions/${res.data.data.subId}`);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to convert quotation.');
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 animate-pulse">
        Loading quotation document...
      </div>
    );
  }

  if (!quotation) {
    return (
      <div className="p-8 text-center text-slate-500">
        Quotation document not found.
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Top Action Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quotations</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Quotation</span>
          </button>

          {/* Customer Accept/Reject */}
          {role === 'customer' && quotation.status === 'sent' && (
            <>
              <button
                onClick={() => handleRespond('accept')}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept Proposal</span>
              </button>
              <button
                onClick={() => handleRespond('reject')}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <XCircle className="w-4 h-4" />
                <span>Decline</span>
              </button>
            </>
          )}

          {/* Staff/Admin 1-Click Convert */}
          {(role === 'admin' || role === 'staff') && quotation.status !== 'converted' && (
            <button
              onClick={handleConvert}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Convert to Subscription</span>
            </button>
          )}
        </div>
      </div>

      {/* Official Printable Quotation Document */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:shadow-none print:border-none">
        {/* Navy Header Banner */}
        <div className="bg-navy-900 text-white p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">BRIGHTLOOP SOFTWARE</h2>
            <p className="text-xs text-slate-300 mt-1">Enterprise SaaS & Subscription Cloud Platform</p>
            <p className="text-[11px] text-slate-400 mt-0.5">GSTIN: 07AABCB9921M1Z1 | contact@brightloop.com</p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest block mb-1">Commercial Proposal</span>
            <span className="text-xl font-mono font-bold text-white">{quotation.quotation_number}</span>
            <div className="mt-2">
              <Badge status={quotation.status} />
            </div>
          </div>
        </div>

        {/* Quotation Metadata Bar */}
        <div className="p-8 border-b border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Proposal Prepared For</p>
            <h4 className="text-base font-bold text-slate-900">{quotation.company_name || quotation.contact_name}</h4>
            <p className="text-xs text-slate-600 mt-1">Attn: {quotation.contact_name}</p>
            <p className="text-xs text-slate-500">{quotation.customer_email}</p>
            {quotation.customer_phone && <p className="text-xs text-slate-500">{quotation.customer_phone}</p>}
            {quotation.billing_address && <p className="text-xs text-slate-500 mt-1">{quotation.billing_address}</p>}
            {quotation.customer_tax_id && (
              <p className="text-xs font-mono text-slate-600 mt-1">Tax ID / GSTIN: {quotation.customer_tax_id}</p>
            )}
          </div>

          <div className="sm:text-right space-y-1.5 text-xs text-slate-600">
            <p><span className="font-semibold text-slate-800">Proposal Date:</span> {quotation.quotation_date}</p>
            <p><span className="font-semibold text-slate-800">Valid Until:</span> {quotation.expiry_date}</p>
            <p><span className="font-semibold text-slate-800">Prepared By:</span> {quotation.created_by_name || 'Brightloop Sales'}</p>
            {quotation.converted_subscription_id && (
              <p className="pt-2 text-indigo-600 font-semibold">
                Converted into Subscription #{quotation.converted_subscription_id}
              </p>
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
              {quotation.lines && quotation.lines.map((line, idx) => (
                <tr key={idx} className="py-3">
                  <td className="py-3.5 pr-4">
                    <p className="font-semibold text-slate-900">{line.product_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{line.description}</p>
                    {line.variant_name && (
                      <span className="text-[11px] text-brand-blue font-medium">{line.variant_name}</span>
                    )}
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
            <div className="max-w-md text-xs text-slate-500 space-y-1">
              <p className="font-bold text-slate-700 uppercase tracking-wider mb-1">Terms & Conditions</p>
              <p>{quotation.notes || 'Payment terms: As per agreement. Taxes calculated as applicable by government regulations.'}</p>
            </div>

            <div className="w-full sm:w-72 bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{parseFloat(quotation.subtotal).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Tax Amount (GST):</span>
                <span className="font-semibold">₹{parseFloat(quotation.tax_amount).toFixed(2)}</span>
              </div>
              {parseFloat(quotation.discount_amount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Special Discount:</span>
                  <span>- ₹{parseFloat(quotation.discount_amount).toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                <span>Total Quotation:</span>
                <span className="text-brand-blue text-base">₹{parseFloat(quotation.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
          Brightloop Software Commercial Proposal • Confidentially Prepared • All rights reserved
        </div>
      </div>
    </div>
  );
}
