import React from 'react';

const statusConfig = {
  // Subscription statuses
  active: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Active' },
  confirmed: { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Confirmed' },
  paused: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Paused' },
  closed: { bg: 'bg-slate-100 text-slate-700 border-slate-300', dot: 'bg-slate-400', label: 'Closed' },
  draft: { bg: 'bg-gray-100 text-gray-700 border-gray-300', dot: 'bg-gray-400', label: 'Draft' },

  // Invoice statuses
  paid: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Paid' },
  unpaid: { bg: 'bg-blue-50 text-blue-700 border-blue-200', dot: 'bg-blue-500', label: 'Unpaid' },
  partial: { bg: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500', label: 'Partial' },
  overdue: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', label: 'Overdue' },
  cancelled: { bg: 'bg-slate-100 text-slate-500 border-slate-200', dot: 'bg-slate-400', label: 'Cancelled' },

  // Quotation statuses
  sent: { bg: 'bg-cyan-50 text-cyan-700 border-cyan-200', dot: 'bg-cyan-500', label: 'Sent' },
  accepted: { bg: 'bg-teal-50 text-teal-700 border-teal-200', dot: 'bg-teal-500', label: 'Accepted' },
  rejected: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', label: 'Rejected' },
  expired: { bg: 'bg-slate-100 text-slate-600 border-slate-300', dot: 'bg-slate-400', label: 'Expired' },
  converted: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', dot: 'bg-indigo-500', label: 'Converted' },

  // Payment statuses
  completed: { bg: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', label: 'Completed' },
  pending: { bg: 'bg-amber-50 text-amber-700 border-amber-200', dot: 'bg-amber-500', label: 'Pending' },
  failed: { bg: 'bg-rose-50 text-rose-700 border-rose-200', dot: 'bg-rose-500', label: 'Failed' },

  // Role badges
  admin: { bg: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-600', label: 'Admin' },
  staff: { bg: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-600', label: 'Staff' },
  customer: { bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-600', label: 'Customer' },

  // Frequencies
  daily: { bg: 'bg-sky-50 text-sky-700 border-sky-200', label: 'Daily' },
  weekly: { bg: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'Weekly' },
  monthly: { bg: 'bg-blue-50 text-blue-700 border-blue-200', label: 'Monthly' },
  yearly: { bg: 'bg-violet-50 text-violet-700 border-violet-200', label: 'Yearly' }
};

export default function Badge({ status, text, size = 'sm', showDot = true }) {
  const key = String(status || '').toLowerCase();
  const config = statusConfig[key] || {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
    label: text || status
  };

  const displayText = text || config.label || status;
  const sizeClasses = size === 'xs' ? 'text-xs px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium border ${config.bg} ${sizeClasses}`}>
      {showDot && config.dot && <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />}
      {displayText}
    </span>
  );
}
