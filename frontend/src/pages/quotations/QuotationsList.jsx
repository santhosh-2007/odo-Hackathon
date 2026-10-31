import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, Plus, ArrowRight, RefreshCw, Eye, Check, X, Printer, PlusCircle, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';

export default function QuotationsList() {
  const { role } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const [quotations, setQuotations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Quotation Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [quotationDate, setQuotationDate] = useState(new Date().toISOString().split('T')[0]);
  const [validityDays, setValidityDays] = useState('30');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState([
    { product_id: '', variant_id: '', plan_id: '', description: '', quantity: 1, unit_price: 1000, tax_rate: 18, discount_amount: 0 }
  ]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [qRes, cRes, pRes, plRes] = await Promise.all([
        api.get('/quotations'),
        role !== 'customer' ? api.get('/customers') : Promise.resolve({ data: { success: true, data: [] } }),
        api.get('/products'),
        api.get('/plans')
      ]);

      if (qRes.data.success) setQuotations(qRes.data.data);
      if (cRes.data.success) setCustomers(cRes.data.data);
      if (pRes.data.success) setProducts(pRes.data.data);
      if (plRes.data.success) setPlans(plRes.data.data);
    } catch (err) {
      error('Failed to load quotations data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openNewQuotation = () => {
    setCustomerId(customers[0]?.id || '');
    setQuotationDate(new Date().toISOString().split('T')[0]);
    setValidityDays('30');
    setNotes('Brightloop Software official quotation. Valid for 30 days.');
    setLines([
      {
        product_id: products[0]?.id || '',
        variant_id: products[0]?.variants[0]?.id || '',
        plan_id: plans[0]?.id || '',
        description: `${products[0]?.name || 'Product'} License`,
        quantity: 1,
        unit_price: products[0]?.sales_price || 1000,
        tax_rate: 18,
        discount_amount: 0
      }
    ]);
    setCreateModalOpen(true);
  };

  const handleLineChange = (index, field, value) => {
    const updated = [...lines];
    updated[index][field] = value;

    if (field === 'product_id') {
      const prod = products.find((p) => String(p.id) === String(value));
      if (prod) {
        updated[index].unit_price = prod.sales_price;
        updated[index].description = `${prod.name} Subscription`;
        updated[index].variant_id = prod.variants?.[0]?.id || '';
      }
    } else if (field === 'plan_id') {
      const plan = plans.find((pl) => String(pl.id) === String(value));
      if (plan) {
        updated[index].unit_price = plan.price;
        updated[index].description = `${plan.name} (${plan.billing_frequency})`;
        updated[index].product_id = plan.product_id;
        updated[index].variant_id = plan.variant_id || '';
      }
    }

    setLines(updated);
  };

  const addLine = () => {
    setLines([
      ...lines,
      {
        product_id: products[0]?.id || '',
        variant_id: '',
        plan_id: '',
        description: 'Additional Subscription Line',
        quantity: 1,
        unit_price: 500,
        tax_rate: 18,
        discount_amount: 0
      }
    ]);
  };

  const removeLine = (idx) => {
    if (lines.length > 1) {
      setLines(lines.filter((_, i) => i !== idx));
    }
  };

  const handleCreateQuotation = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/quotations', {
        customer_id: customerId,
        quotation_date: quotationDate,
        validity_days: validityDays,
        lines,
        notes,
        status: 'sent'
      });
      success(res.data.message);
      setCreateModalOpen(false);
      fetchData();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create quotation.');
    }
  };

  // Convert Quotation to Subscription in 1 Click!
  const handleConvertToSubscription = async (qId) => {
    if (!window.confirm('Convert this quotation directly into an active subscription?')) return;
    try {
      const res = await api.post(`/quotations/${qId}/convert`, {
        payment_terms: 'immediate',
        start_date: new Date().toISOString().split('T')[0]
      });
      success(res.data.message);
      fetchData();
      navigate(`/subscriptions/${res.data.data.subId}`);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to convert quotation.');
    }
  };

  const columns = [
    {
      header: 'Quotation #',
      accessor: 'quotation_number',
      render: (row) => (
        <Link
          to={role === 'customer' ? `/portal/quotations/${row.id}` : `/quotations/${row.id}`}
          className="font-semibold text-brand-blue hover:underline"
        >
          {row.quotation_number}
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
      header: 'Date & Validity',
      accessor: 'quotation_date',
      render: (row) => (
        <div className="text-xs">
          <p className="text-slate-800 font-medium">{row.quotation_date}</p>
          <p className="text-slate-400">Valid until {row.expiry_date}</p>
        </div>
      )
    },
    {
      header: 'Total Amount',
      accessor: 'total_amount',
      render: (row) => (
        <div className="font-bold text-slate-900">
          ₹{parseFloat(row.total_amount).toFixed(2)}
          <span className="block text-[11px] text-slate-400 font-normal">
            Tax: ₹{parseFloat(row.tax_amount).toFixed(2)}
          </span>
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
          <Link
            to={role === 'customer' ? `/portal/quotations/${row.id}` : `/quotations/${row.id}`}
            className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
            title="View Quotation"
          >
            <Eye className="w-4 h-4" />
          </Link>

          {(role === 'admin' || role === 'staff') && row.status !== 'converted' && (
            <button
              onClick={() => handleConvertToSubscription(row.id)}
              className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
              title="Convert to Subscription"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Convert</span>
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Quotations Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate, customize, and seamlessly convert formal proposals into recurring subscriptions
          </p>
        </div>

        {(role === 'admin' || role === 'staff') && (
          <button
            onClick={openNewQuotation}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-blue/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Quotation</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={quotations}
        loading={loading}
        searchPlaceholder="Search quotation number or customer..."
        searchKey="quotation_number"
        filters={[
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'draft', label: 'Draft' },
              { value: 'sent', label: 'Sent' },
              { value: 'accepted', label: 'Accepted' },
              { value: 'converted', label: 'Converted' },
              { value: 'rejected', label: 'Rejected' },
              { value: 'expired', label: 'Expired' }
            ]
          }
        ]}
      />

      {/* Create Quotation Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create New Commercial Quotation"
        size="xl"
      >
        <form onSubmit={handleCreateQuotation} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Customer *</label>
              <select
                required
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
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
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Quotation Date</label>
              <input
                type="date"
                required
                value={quotationDate}
                onChange={(e) => setQuotationDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Validity Period (Days)</label>
              <input
                type="number"
                min="1"
                required
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          {/* Line Items Builder */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Quotation Line Items
              </label>
              <button
                type="button"
                onClick={addLine}
                className="flex items-center gap-1 text-xs font-semibold text-brand-blue hover:text-brand-blue-light"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-3">
              {lines.map((line, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl relative space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Plan / Product</label>
                      <select
                        value={line.plan_id}
                        onChange={(e) => handleLineChange(idx, 'plan_id', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      >
                        <option value="">Select Subscription Plan</option>
                        {plans.map((pl) => (
                          <option key={pl.id} value={pl.id}>
                            {pl.name} (₹{parseFloat(pl.price).toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Description</label>
                      <input
                        type="text"
                        value={line.description}
                        onChange={(e) => handleLineChange(idx, 'description', e.target.value)}
                        placeholder="Item description"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={line.quantity}
                        onChange={(e) => handleLineChange(idx, 'quantity', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Unit Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={line.unit_price}
                        onChange={(e) => handleLineChange(idx, 'unit_price', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Tax (%)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={line.tax_rate}
                        onChange={(e) => handleLineChange(idx, 'tax_rate', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">Discount (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={line.discount_amount}
                        onChange={(e) => handleLineChange(idx, 'discount_amount', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {lines.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeLine(idx)}
                      className="absolute top-2 right-2 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Notes / Terms</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              Generate Quotation
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
