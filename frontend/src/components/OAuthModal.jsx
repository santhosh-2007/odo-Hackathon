import React, { useState } from 'react';
import { X, Check, ArrowRight, Shield, User, Loader2 } from 'lucide-react';

export default function OAuthModal({ isOpen, onClose, provider, onAuthenticate, loading }) {
  if (!isOpen || !provider) return null;

  const [mode, setMode] = useState('list'); // 'list' | 'custom'
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customRole, setCustomRole] = useState('customer');

  const providerMeta = {
    google: {
      name: 'Google',
      themeColor: '#4285F4',
      badgeBg: 'bg-blue-50',
      badgeText: 'text-blue-700',
      badgeBorder: 'border-blue-200',
      tagline: 'Sign in with your Google Workspace or Personal account',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
      ),
      sampleAccounts: [
        { name: 'Alex Mercer (Customer)', email: 'billing@acmecorp.com', role: 'customer', domain: 'acmecorp.com' },
        { name: 'Brightloop Administrator', email: 'admin@brightloop.com', role: 'admin', domain: 'brightloop.com' },
        { name: 'Sarah Jenkins (Billing Ops)', email: 'staff@brightloop.com', role: 'staff', domain: 'brightloop.com' }
      ]
    },
    microsoft: {
      name: 'Microsoft',
      themeColor: '#00A4EF',
      badgeBg: 'bg-cyan-50',
      badgeText: 'text-cyan-700',
      badgeBorder: 'border-cyan-200',
      tagline: 'Sign in with your Microsoft 365 or Azure Entra account',
      icon: (
        <svg className="w-5 h-5" viewBox="0 0 23 23">
          <path fill="#f35325" d="M1 1h10v10H1z"/>
          <path fill="#81bc06" d="M12 1h10v10H12z"/>
          <path fill="#05a6f0" d="M1 12h10v10H1z"/>
          <path fill="#ffba08" d="M12 12h10v10H12z"/>
        </svg>
      ),
      sampleAccounts: [
        { name: 'Elena Rostova (Nexus CRM)', email: 'finance@nexuscrm.com', role: 'customer', domain: 'nexuscrm.com' },
        { name: 'Brightloop Administrator', email: 'admin@brightloop.com', role: 'admin', domain: 'brightloop.com' },
        { name: 'Sarah Jenkins (Staff)', email: 'staff@brightloop.com', role: 'staff', domain: 'brightloop.com' }
      ]
    },
    github: {
      name: 'GitHub',
      themeColor: '#24292F',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-800',
      badgeBorder: 'border-slate-300',
      tagline: 'Authorize Brightloop Software with your GitHub Developer account',
      icon: (
        <svg className="w-5 h-5 fill-slate-900" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
      ),
      sampleAccounts: [
        { name: 'Devon Vance (TechFlow)', email: 'ops@techflow.io', role: 'customer', domain: 'github.com/techflow-dev' },
        { name: 'Brightloop Administrator', email: 'admin@brightloop.com', role: 'admin', domain: 'github.com/brightloop-admin' },
        { name: 'Vikram Malhotra (Vertex AI)', email: 'admin@vertexai.co', role: 'customer', domain: 'github.com/vertexai-core' }
      ]
    }
  };

  const meta = providerMeta[provider] || providerMeta.google;

  const handleSelectAccount = (acc) => {
    onAuthenticate({
      provider,
      email: acc.email,
      name: acc.name,
      oauth_id: `${provider}_${acc.email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(acc.email)}`,
      role: acc.role
    });
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (!customEmail) return;
    onAuthenticate({
      provider,
      email: customEmail.trim(),
      name: customName.trim() || customEmail.split('@')[0],
      oauth_id: `${provider}_custom_${Date.now()}`,
      avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(customEmail)}`,
      role: customRole
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full overflow-hidden transition-all transform scale-100">
        {/* Top Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 shadow-sm">
              {meta.icon}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5">
                Sign in with {meta.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Brightloop Software Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          <p className="text-xs text-slate-600 leading-relaxed">
            {meta.tagline}. Select an active identity below or enter your verified enterprise email:
          </p>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
              <p className="text-sm font-semibold text-slate-700">
                Authorizing with {meta.name}...
              </p>
              <p className="text-xs text-slate-400">Verifying tokens and issuing secure session</p>
            </div>
          ) : mode === 'list' ? (
            <>
              {/* Sample Quick Accounts */}
              <div className="space-y-2.5">
                {meta.sampleAccounts.map((acc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectAccount(acc)}
                    className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200/90 hover:border-brand-blue/50 hover:bg-slate-50/80 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 uppercase flex-shrink-0">
                        {acc.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate group-hover:text-brand-blue">
                          {acc.name}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">{acc.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {acc.role}
                    </span>
                  </button>
                ))}
              </div>

              {/* Toggle to custom email */}
              <button
                type="button"
                onClick={() => setMode('custom')}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-slate-300 hover:border-slate-400 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span>Sign in with another {meta.name} email</span>
              </button>
            </>
          ) : (
            <form onSubmit={handleCustomSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Santhosh Kumar"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  {meta.name} Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder={`name@${provider === 'google' ? 'gmail.com' : provider === 'microsoft' ? 'outlook.com' : 'github.com'}`}
                  value={customEmail}
                  onChange={(e) => setCustomEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Account Type / Role
                </label>
                <select
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue focus:bg-white"
                >
                  <option value="customer">Customer (Workspace Account)</option>
                  <option value="staff">Staff (Billing Specialist)</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setMode('list')}
                  className="text-xs font-medium text-slate-500 hover:text-slate-800"
                >
                  Back to accounts
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5 transition-colors shadow-md"
                >
                  <span>Authorize & Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* Privacy & Scope Footer */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>TLS 256-bit Encrypted SSO</span>
            </span>
            <span>Brightloop Software</span>
          </div>
        </div>
      </div>
    </div>
  );
}
