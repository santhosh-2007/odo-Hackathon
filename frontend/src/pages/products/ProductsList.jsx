import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Layers, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import DataTable from '../../components/DataTable';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';

export default function ProductsList() {
  const { role } = useAuth();
  const { success, error } = useToast();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    product_code: '',
    name: '',
    product_type: 'saas_subscription',
    sales_price: '',
    cost_price: '',
    description: '',
    status: 'active'
  });

  // Variant Modal
  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [variantForm, setVariantForm] = useState({
    variant_name: '',
    sku: '',
    additional_price: ''
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await api.get('/products');
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err) {
      error('Failed to load product catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const openCreateModal = () => {
    setEditingProduct(null);
    setProductForm({
      product_code: `PRD-BL-${Date.now().toString().slice(-4)}`,
      name: '',
      product_type: 'saas_subscription',
      sales_price: '',
      cost_price: '',
      description: '',
      status: 'active'
    });
    setProductModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      product_code: prod.product_code,
      name: prod.name,
      product_type: prod.product_type,
      sales_price: prod.sales_price,
      cost_price: prod.cost_price,
      description: prod.description || '',
      status: prod.status
    });
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, productForm);
        success('Product updated successfully!');
      } else {
        await api.post('/products', productForm);
        success('Product created successfully with standard variant!');
      }
      setProductModalOpen(false);
      fetchProducts();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to save product.');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure? If the product has historical transactions, it will be safely deactivated.')) return;
    try {
      const res = await api.delete(`/products/${id}`);
      success(res.data.message);
      fetchProducts();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete/deactivate product.');
    }
  };

  // Variant Actions
  const openVariantModal = (prod) => {
    setSelectedProduct(prod);
    setVariantForm({
      variant_name: '',
      sku: `SKU-${prod.product_code}-${Date.now().toString().slice(-4)}`,
      additional_price: '0'
    });
    setVariantModalOpen(true);
  };

  const handleAddVariant = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/products/${selectedProduct.id}/variants`, variantForm);
      success('Variant added successfully!');
      setVariantModalOpen(false);
      fetchProducts();
    } catch (err) {
      error(err.response?.data?.message || 'Failed to add variant.');
    }
  };

  const columns = [
    {
      header: 'Product',
      accessor: 'name',
      render: (row) => (
        <div>
          <div className="font-semibold text-slate-900">{row.name}</div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">{row.product_code}</div>
        </div>
      )
    },
    {
      header: 'Type',
      accessor: 'product_type',
      render: (row) => (
        <span className="capitalize text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
          {row.product_type.replace('_', ' ')}
        </span>
      )
    },
    {
      header: 'Base Price',
      accessor: 'sales_price',
      render: (row) => (
        <div className="font-semibold text-slate-900">
          ₹{parseFloat(row.sales_price).toFixed(2)}
        </div>
      )
    },
    {
      header: 'Variants & Addon Pricing',
      accessor: 'variants',
      render: (row) => (
        <div className="space-y-1">
          {row.variants && row.variants.length > 0 ? (
            row.variants.map((v) => (
              <div key={v.id} className="text-xs flex items-center gap-1.5 text-slate-600">
                <span className="font-medium text-slate-800">{v.variant_name}:</span>
                <span className="text-brand-blue font-semibold">₹{parseFloat(v.calculated_final_price).toFixed(2)}</span>
                {parseFloat(v.additional_price) > 0 && (
                  <span className="text-[10px] text-slate-400">(+₹{parseFloat(v.additional_price).toFixed(2)})</span>
                )}
              </div>
            ))
          ) : (
            <span className="text-xs text-slate-400">Standard only</span>
          )}
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
            <>
              <button
                onClick={() => openVariantModal(row)}
                className="p-1.5 text-slate-400 hover:text-brand-purple hover:bg-purple-50 rounded-lg transition-colors"
                title="Add Variant"
              >
                <Layers className="w-4 h-4" />
              </button>
              <button
                onClick={() => openEditModal(row)}
                className="p-1.5 text-slate-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Product"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </>
          )}
          {role === 'admin' && (
            <button
              onClick={() => handleDeleteProduct(row.id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Delete or Deactivate"
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
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Product Catalog & Variants</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage software offerings, base pricing, and brand variants
          </p>
        </div>

        {(role === 'admin' || role === 'staff') && (
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl text-xs font-semibold shadow-md shadow-brand-blue/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={products}
        loading={loading}
        searchPlaceholder="Search product name or code..."
        searchKey="name"
        filters={[
          {
            key: 'product_type',
            label: 'Type',
            options: [
              { value: 'saas_subscription', label: 'SaaS Subscription' },
              { value: 'software_license', label: 'Software License' },
              { value: 'cloud_hosting', label: 'Cloud Hosting' },
              { value: 'support_addon', label: 'Support Addon' }
            ]
          },
          {
            key: 'status',
            label: 'Status',
            options: [
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' }
            ]
          }
        ]}
      />

      {/* Product Create / Edit Modal */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => setProductModalOpen(false)}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <form onSubmit={handleSaveProduct} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Product Code</label>
              <input
                type="text"
                required
                value={productForm.product_code}
                onChange={(e) => setProductForm({ ...productForm, product_code: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Product Type</label>
              <select
                value={productForm.product_type}
                onChange={(e) => setProductForm({ ...productForm, product_type: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              >
                <option value="saas_subscription">SaaS Subscription</option>
                <option value="software_license">Software License</option>
                <option value="cloud_hosting">Cloud Hosting</option>
                <option value="support_addon">Support Addon</option>
                <option value="service">Professional Service</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Product Name *</label>
            <input
              type="text"
              required
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              placeholder="e.g. Brightloop Cloud ERP"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Sales Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                required
                value={productForm.sales_price}
                onChange={(e) => setProductForm({ ...productForm, sales_price: e.target.value })}
                placeholder="1000.00"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Cost Price (₹)</label>
              <input
                type="number"
                step="0.01"
                value={productForm.cost_price}
                onChange={(e) => setProductForm({ ...productForm, cost_price: e.target.value })}
                placeholder="400.00"
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Description / Notes</label>
            <textarea
              rows={3}
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              placeholder="Product features, module breakdown..."
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setProductModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-blue text-white rounded-xl text-xs font-semibold hover:bg-brand-blue-light transition-all shadow-md"
            >
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Add Variant Modal */}
      <Modal
        isOpen={variantModalOpen}
        onClose={() => setVariantModalOpen(false)}
        title={`Add Variant to ${selectedProduct?.name}`}
      >
        <form onSubmit={handleAddVariant} className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-xs text-blue-900 leading-relaxed">
            <span className="font-semibold">Example Variant Rule:</span> Base price is ₹{parseFloat(selectedProduct?.sales_price || 0).toFixed(2)}.
            If additional price is ₹560, final calculated price will automatically be ₹{(parseFloat(selectedProduct?.sales_price || 0) + parseFloat(variantForm.additional_price || 0)).toFixed(2)}.
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Variant Name *</label>
            <input
              type="text"
              required
              value={variantForm.variant_name}
              onChange={(e) => setVariantForm({ ...variantForm, variant_name: e.target.value })}
              placeholder="e.g. Odoo Brand Integration Edition"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Variant SKU</label>
            <input
              type="text"
              required
              value={variantForm.sku}
              onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Additional Price (₹) *</label>
            <input
              type="number"
              step="0.01"
              required
              value={variantForm.additional_price}
              onChange={(e) => setVariantForm({ ...variantForm, additional_price: e.target.value })}
              placeholder="560.00"
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setVariantModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-brand-purple text-white rounded-xl text-xs font-semibold hover:bg-brand-purple-light transition-all shadow-md"
            >
              Save Variant
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
