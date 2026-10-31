import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Layers, 
  FileText, 
  RefreshCw, 
  Receipt, 
  CreditCard, 
  Percent, 
  Calculator, 
  Users, 
  ShieldCheck, 
  BarChart3, 
  User, 
  X,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, role } = useAuth();

  // Navigation Links tailored by Role
  const getNavSections = () => {
    if (role === 'customer') {
      return [
        {
          title: 'CUSTOMER PORTAL',
          items: [
            { name: 'Dashboard', path: '/portal', icon: LayoutDashboard },
            { name: 'My Subscriptions', path: '/portal/subscriptions', icon: RefreshCw },
            { name: 'Subscription Plans', path: '/portal/plans', icon: Layers },
            { name: 'My Quotations', path: '/portal/quotations', icon: FileText },
            { name: 'My Invoices', path: '/portal/invoices', icon: Receipt },
            { name: 'Payment History', path: '/portal/payments', icon: CreditCard },
            { name: 'Company Profile', path: '/profile', icon: User }
          ]
        }
      ];
    }

    if (role === 'staff') {
      return [
        {
          title: 'OPERATIONS',
          items: [
            { name: 'Staff Dashboard', path: '/staff', icon: LayoutDashboard },
            { name: 'Customers', path: '/customers', icon: Users },
            { name: 'Quotations', path: '/quotations', icon: FileText },
            { name: 'Subscriptions', path: '/subscriptions', icon: RefreshCw },
            { name: 'Invoices', path: '/invoices', icon: Receipt },
            { name: 'Payments', path: '/payments', icon: CreditCard }
          ]
        },
        {
          title: 'CATALOG & REPORTS',
          items: [
            { name: 'Products & Variants', path: '/products', icon: Package },
            { name: 'Subscription Plans', path: '/plans', icon: Layers },
            { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 }
          ]
        }
      ];
    }

    // Default: Admin
    return [
      {
        title: 'MAIN',
        items: [
          { name: 'Admin Dashboard', path: '/admin', icon: LayoutDashboard },
          { name: 'Reports & Analytics', path: '/reports', icon: BarChart3 }
        ]
      },
      {
        title: 'SUBSCRIPTIONS & SALES',
        items: [
          { name: 'Quotations', path: '/quotations', icon: FileText },
          { name: 'Subscriptions', path: '/subscriptions', icon: RefreshCw },
          { name: 'Invoices & Billing', path: '/invoices', icon: Receipt },
          { name: 'Payments Tracking', path: '/payments', icon: CreditCard }
        ]
      },
      {
        title: 'CATALOG & PRICING',
        items: [
          { name: 'Products & Variants', path: '/products', icon: Package },
          { name: 'Subscription Plans', path: '/plans', icon: Layers },
          { name: 'Tax Rules', path: '/taxes', icon: Calculator },
          { name: 'Discounts & Coupons', path: '/discounts', icon: Percent }
        ]
      },
      {
        title: 'USER MANAGEMENT',
        items: [
          { name: 'Customers CRM', path: '/customers', icon: Users },
          { name: 'Staff Accounts', path: '/staff', icon: ShieldCheck }
        ]
      }
    ];
  };

  const sections = getNavSections();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-navy-800 text-slate-300 flex flex-col border-r border-navy-700/60 shadow-xl transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-navy-700/80 bg-navy-900/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-blue to-brand-purple flex items-center justify-center text-white shadow-md shadow-brand-blue/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-white text-base tracking-tight leading-none">Brightloop</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-1">Software SMS</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-navy-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
          {sections.map((section, sIdx) => (
            <div key={sIdx}>
              <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {section.title}
              </p>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/admin' || item.path === '/staff' || item.path === '/portal'}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-brand-blue to-brand-blue-light text-white shadow-md shadow-brand-blue/20'
                          : 'text-slate-300 hover:text-white hover:bg-navy-700/60'
                      }`
                    }
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer User Info */}
        <div className="p-4 border-t border-navy-700/80 bg-navy-900/40">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-brand-purple to-brand-blue flex items-center justify-center text-white text-xs font-bold uppercase shadow-inner">
              {user?.name ? user.name.slice(0, 2) : 'BL'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
              <p className="text-xs text-slate-400 truncate capitalize">{user?.role} Account</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
