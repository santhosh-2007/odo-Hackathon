import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('brightloop_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to catch unauthorized / standard errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect if trying to login
      if (!error.config.url.includes('/auth/login') && !error.config.url.includes('/auth/register')) {
        localStorage.removeItem('brightloop_token');
        localStorage.removeItem('brightloop_user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Helper to reliably download Invoice PDF across all browsers
export async function downloadInvoicePdf(invoiceId, invoiceNumber) {
  const token = localStorage.getItem('brightloop_token');
  try {
    const response = await api.get(`/invoices/${invoiceId}/pdf`, {
      responseType: 'blob'
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${invoiceNumber || `INV-${invoiceId}`}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Blob PDF download failed, using direct URL fallback:', error);
    if (token) {
      window.open(`/api/invoices/${invoiceId}/pdf?token=${encodeURIComponent(token)}`, '_blank');
      return true;
    }
    throw error;
  }
}

// Helper to reliably download Financial Reports as CSV
export async function downloadReportCsv(reportType, params = {}) {
  const token = localStorage.getItem('brightloop_token');
  try {
    const response = await api.get(`/reports/${reportType}/csv`, {
      params,
      responseType: 'blob'
    });

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Brightloop_${reportType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
    window.URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Blob CSV download failed, trying direct link fallback:', error);
    if (token) {
      const q = new URLSearchParams(params);
      q.append('token', token);
      window.open(`/api/reports/${reportType}/csv?${q.toString()}`, '_blank');
      return true;
    }
    throw error;
  }
}

// Client-side CSV export utility for DataTables
export function exportDataToCsv(data = [], filename = 'export.csv', columns = null) {
  if (!Array.isArray(data) || data.length === 0) {
    return false;
  }

  let headers = [];
  if (columns && Array.isArray(columns)) {
    headers = columns.map(c => c.header || c.accessor || '');
  } else {
    headers = Object.keys(data[0]);
  }

  const rows = data.map(item => {
    if (columns && Array.isArray(columns)) {
      return columns.map(c => {
        let val = item[c.accessor];
        if (val === undefined || val === null) val = '';
        if (typeof val === 'object') val = JSON.stringify(val);
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',');
    } else {
      return headers.map(h => {
        let val = item[h];
        if (val === undefined || val === null) val = '';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      }).join(',');
    }
  });

  const headerRow = headers.map(h => `"${String(h).replace(/"/g, '""')}"`).join(',');
  const csvContent = '\uFEFF' + [headerRow, ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  link.parentNode.removeChild(link);
  window.URL.revokeObjectURL(url);
  return true;
}

export default api;
