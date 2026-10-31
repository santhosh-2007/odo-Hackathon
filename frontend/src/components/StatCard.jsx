import React from 'react';

export default function StatCard({ title, value, icon: Icon, trend, subtitle, color = 'blue', loading = false }) {
  const colorMap = {
    blue: {
      bg: 'bg-blue-50 text-blue-600',
      border: 'hover:border-blue-200'
    },
    purple: {
      bg: 'bg-purple-50 text-purple-600',
      border: 'hover:border-purple-200'
    },
    emerald: {
      bg: 'bg-emerald-50 text-emerald-600',
      border: 'hover:border-emerald-200'
    },
    rose: {
      bg: 'bg-rose-50 text-rose-600',
      border: 'hover:border-rose-200'
    },
    amber: {
      bg: 'bg-amber-50 text-amber-600',
      border: 'hover:border-amber-200'
    },
    indigo: {
      bg: 'bg-indigo-50 text-indigo-600',
      border: 'hover:border-indigo-200'
    }
  };

  const scheme = colorMap[color] || colorMap.blue;

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse">
        <div className="h-4 w-24 bg-slate-200 rounded mb-3"></div>
        <div className="h-8 w-32 bg-slate-200 rounded mb-2"></div>
        <div className="h-3 w-20 bg-slate-100 rounded"></div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-sm transition-all duration-200 hover:shadow-md ${scheme.border}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-2 tracking-tight">{value}</h3>
          {(subtitle || trend) && (
            <div className="flex items-center gap-2 mt-2">
              {trend && (
                <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${trend.startsWith('+') ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                  {trend}
                </span>
              )}
              {subtitle && <span className="text-xs text-slate-400">{subtitle}</span>}
            </div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${scheme.bg}`}>
            <Icon className="w-6 h-6" />
          </div>
        )}
      </div>
    </div>
  );
}
