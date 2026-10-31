import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  Download, 
  Printer, 
  Calendar, 
  Search, 
  IndianRupee, 
  RefreshCw, 
  Receipt, 
  Users, 
  Clock 
} from 'lucide-react';
import api, { downloadReportCsv } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Badge from '../../components/Badge';

const REPORT_TABS = [
  { id: 'total-revenue', name: 'Total Revenue', icon: IndianRupee },
  { id: 'monthly-revenue', name: 'Monthly Revenue', icon: BarChart3 },
  { id: 'active-subscriptions', name: 'Active Subscriptions', icon: RefreshCw },
  { id: 'closed-subscriptions', name: 'Closed Subscriptions', icon: Clock },
  { id: 'outstanding-invoices', name: 'Outstanding Invoices', icon: Receipt },
  { id: 'overdue-invoices', name: 'Overdue Invoices', icon: Receipt },
  { id: 'payment-history', name: 'Payment History', icon: IndianRupee },
  { id: 'customer-subscriptions', name: 'Customer Subscriptions', icon: Users }
];

export default function ReportsPage() {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState('total-revenue');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (search) params.search = search;

      const res = await api.get(`/reports/${activeTab}`, { params });
      if (res.data.success) {
        setReportData(res.data);
      }
    } catch (err) {
      error('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeTab]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const handleExportCsv = async () => {
    try {
      setExporting(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (search) params.search = search;

      await downloadReportCsv(activeTab, params);
      success(`Report "${activeTab}" exported successfully as CSV!`);
    } catch (err) {
      error(err.response?.data?.message || 'Failed to export CSV report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const summary = reportData?.summary || {};
  const rows = reportData?.data || [];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Financial Reports & Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Reconcile collected cash, invoiced revenue, contract commitments, and aging balances
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3.5 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-semibold text-slate-700 transition-colors"
          >
            <Printer className="w-4 h-4 text-slate-500" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all cursor-pointer disabled:opacity-50"
            title="Download Report as CSV Spreadsheet"
          >
            <Download className="w-4 h-4" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-px print:hidden">
        {REPORT_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearch('');
              }}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-all border-b-2 ${
                isActive
                  ? 'border-brand-blue text-brand-blue bg-blue-50/50 rounded-t-xl'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm print:hidden">
        <form onSubmit={handleApplyFilters} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full sm:w-auto">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search in report..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 bg-brand-blue hover:bg-brand-blue-light text-white rounded-xl text-xs font-semibold transition-all"
          >
            Apply Filters
          </button>
        </form>
      </div>

      {/* Report Summary KPI Banner */}
      <div className="bg-navy-900 text-white rounded-2xl p-6 shadow-md flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
            Active Statement
          </span>
          <h3 className="text-xl font-bold tracking-tight">
            {REPORT_TABS.find((t) => t.id === activeTab)?.name}
          </h3>
          <p className="text-xs text-slate-300 mt-1">Total {rows.length} record(s) matching current parameters</p>
        </div>

        <div className="flex items-center gap-6">
          {summary.totalRevenueCollected !== undefined && (
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Total Collected</span>
              <span className="text-2xl font-bold text-emerald-400">
                ₹{parseFloat(summary.totalRevenueCollected).toLocaleString()}
              </span>
            </div>
          )}

          {summary.totalOutstandingAmount !== undefined && (
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Outstanding Due</span>
              <span className="text-2xl font-bold text-rose-400">
                ₹{parseFloat(summary.totalOutstandingAmount).toLocaleString()}
              </span>
            </div>
          )}

          {summary.totalOverdueAmount !== undefined && (
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Overdue Balance</span>
              <span className="text-2xl font-bold text-rose-400">
                ₹{parseFloat(summary.totalOverdueAmount).toLocaleString()}
              </span>
            </div>
          )}

          {summary.totalCommittedRevenue !== undefined && (
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Active Committed MRR</span>
              <span className="text-2xl font-bold text-blue-400">
                ₹{parseFloat(summary.totalCommittedRevenue).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Report Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {rows.length > 0 &&
                  Object.keys(rows[0]).map((colName, cIdx) => (
                    <th key={cIdx} className="px-5 py-3.5 capitalize">
                      {colName.replace(/_/g, ' ')}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400 animate-pulse">
                    Calculating metrics from database...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    No records found for the selected filter range.
                  </td>
                </tr>
              ) : (
                rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                    {Object.entries(row).map(([key, val], vIdx) => {
                      const isMoney = key.includes('amount') || key.includes('revenue') || key.includes('due') || key.includes('paid');
                      return (
                        <td key={vIdx} className="px-5 py-3">
                          {isMoney && typeof val === 'number' ? (
                            <span className="font-semibold text-slate-900">₹{parseFloat(val).toFixed(2)}</span>
                          ) : key === 'status' || key === 'payment_status' ? (
                            <Badge status={val} size="xs" />
                          ) : (
                            String(val || '—')
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
