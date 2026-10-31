import React, { useState, useMemo } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox, Download } from 'lucide-react';
import { exportDataToCsv } from '../services/api';

export default function DataTable({
  columns,
  data = [],
  loading = false,
  searchPlaceholder = 'Search records...',
  searchKey,
  customSearch,
  filters = [],
  actions,
  pageSize = 10,
  emptyMessage = 'No records found.',
  exportable = true
}) {
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const handleExportTableCsv = () => {
    if (!filteredData || filteredData.length === 0) return;
    const cleanName = searchPlaceholder ? searchPlaceholder.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^search_/, '') : 'records';
    exportDataToCsv(filteredData, `Brightloop_${cleanName}_${Date.now()}.csv`, columns);
  };

  const handleFilterChange = (key, val) => {
    setFilterValues((prev) => ({ ...prev, [key]: val }));
    setCurrentPage(1);
  };

  // Filtered dataset
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // 1. Search filter
      if (search) {
        const query = search.toLowerCase();
        if (customSearch) {
          if (!customSearch(item, query)) return false;
        } else if (searchKey) {
          const val = String(item[searchKey] || '').toLowerCase();
          if (!val.includes(query)) return false;
        } else {
          // Search all string fields
          const match = Object.values(item).some((v) =>
            typeof v === 'string' && v.toLowerCase().includes(query)
          );
          if (!match) return false;
        }
      }

      // 2. Custom dropdown filters
      for (const [key, val] of Object.entries(filterValues)) {
        if (val && val !== 'all') {
          if (String(item[key]) !== String(val)) return false;
        }
      }

      return true;
    });
  }, [data, search, searchKey, customSearch, filterValues]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredData.length / pageSize));
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage, pageSize]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          {/* Search bar */}
          <div className="relative min-w-[240px] max-w-sm flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue transition-all"
            />
          </div>

          {/* Filter Dropdowns */}
          {filters.map((f) => (
            <select
              key={f.key}
              value={filterValues[f.key] || 'all'}
              onChange={(e) => handleFilterChange(f.key, e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue"
            >
              <option value="all">{f.label}: All</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {actions}
          {exportable && filteredData.length > 0 && (
            <button
              type="button"
              onClick={handleExportTableCsv}
              className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              title="Export records as CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/75 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th key={idx} className={`px-6 py-3.5 ${col.className || ''}`}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {loading ? (
              // Loading Skeleton Rows
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {columns.map((_, c) => (
                    <td key={c} className="px-6 py-4">
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-slate-400">
                    <Inbox className="w-12 h-12 stroke-[1.2] mb-3 text-slate-300" />
                    <p className="text-base font-medium text-slate-600">{emptyMessage}</p>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters.</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Data Rows
              paginatedData.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="hover:bg-slate-50/80 transition-colors duration-150"
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-6 py-4 ${col.className || ''}`}>
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {!loading && filteredData.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-white">
          <div>
            Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-slate-700">
              {Math.min(currentPage * pageSize, filteredData.length)}
            </span>{' '}
            of <span className="font-semibold text-slate-700">{filteredData.length}</span> results
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 py-1 font-medium text-slate-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
