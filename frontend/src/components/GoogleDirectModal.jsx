import React, { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, ShieldCheck, Mail, Sparkles, Key, CheckCircle, ExternalLink, Loader2 } from 'lucide-react';

export default function GoogleDirectModal({ isOpen, onClose, onDirectAuth, loading }) {
  if (!isOpen) return null;

  const [realEmail, setRealEmail] = useState('');
  const [realName, setRealName] = useState('');
  const [role, setRole] = useState('customer');
  const [googleClientId, setGoogleClientId] = useState(() => {
    return import.meta.env.VITE_GOOGLE_CLIENT_ID || localStorage.getItem('brightloop_google_client_id') || '';
  });
  const [showConfig, setShowConfig] = useState(false);
  const [gisInitialized, setGisInitialized] = useState(false);
  const googleBtnRef = useRef(null);

  // Initialize official Google Identity Services button if Client ID exists
  useEffect(() => {
    if (googleClientId && window.google?.accounts?.id && googleBtnRef.current) {
      try {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: (response) => {
            if (response.credential) {
              onDirectAuth({ credential: response.credential });
            }
          }
        });

        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: 380,
          text: 'continue_with',
          shape: 'rectangular',
          logo_alignment: 'left'
        });

        setGisInitialized(true);
      } catch (err) {
        console.warn('GIS button render error:', err);
      }
    }
  }, [googleClientId, isOpen]);

  const handleSaveClientId = (e) => {
    e.preventDefault();
    if (googleClientId) {
      localStorage.setItem('brightloop_google_client_id', googleClientId.trim());
      setShowConfig(false);
    }
  };

  const handleDirectEmailSubmit = (e) => {
    e.preventDefault();
    if (!realEmail) return;

    onDirectAuth({
      email: realEmail.trim(),
      name: realName.trim() || realEmail.split('@')[0],
      role: role
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transition-all transform scale-100">
        {/* Top Header */}
        <div className="p-6 bg-slate-50 border-b border-slate-200/80 flex items-start justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Google Direct Authentication
              </h3>
              <p className="text-xs text-slate-500">Sign in with your original Google / Gmail account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-brand-blue animate-spin" />
              <p className="text-sm font-semibold text-slate-800">Authenticating with Google...</p>
              <p className="text-xs text-slate-400">Verifying identity and establishing secure session</p>
            </div>
          ) : (
            <>
              {/* Option A: Native Google Identity Services Button (if Client ID present) */}
              {googleClientId && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Official Google Sign-In Window
                  </p>
                  <div className="flex justify-center p-2 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <div ref={googleBtnRef} />
                  </div>
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-slate-200" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-3 text-slate-400 font-semibold tracking-wider">
                        Or direct verified email
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Option B: Direct Real Gmail Input */}
              <form onSubmit={handleDirectEmailSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Your Original Google / Gmail Address *
                    </label>
                    <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Instant Google Login
                    </span>
                  </div>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. yourname@gmail.com"
                      value={realEmail}
                      onChange={(e) => setRealEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue focus:bg-white font-medium"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Enter your personal or business Gmail address. You will be logged into your workspace immediately.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Your Name (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Santhosh"
                      value={realName}
                      onChange={(e) => setRealName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Target Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue focus:bg-white"
                    >
                      <option value="customer">Customer Portal</option>
                      <option value="staff">Staff Operations</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 shadow-md transition-all cursor-pointer"
                >
                  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Authenticate with Google</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Google Cloud Client ID Configuration Toggle */}
              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowConfig(!showConfig)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>{showConfig ? 'Hide Google Cloud Client ID setup' : 'Have a Google Cloud Client ID? (Optional)'}</span>
                </button>

                {showConfig && (
                  <form onSubmit={handleSaveClientId} className="mt-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <label className="block text-[11px] font-semibold text-slate-700">
                      Google OAuth Client ID (from Google Cloud Console)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 123456789-abcdef.apps.googleusercontent.com"
                      value={googleClientId}
                      onChange={(e) => setGoogleClientId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                    <div className="flex items-center justify-between text-[11px]">
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-blue hover:underline inline-flex items-center gap-1"
                      >
                        <span>Open Google Console</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="submit"
                        className="px-3 py-1 bg-brand-blue text-white rounded-lg font-semibold hover:bg-blue-600 text-xs"
                      >
                        Save & Enable Live Popup
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </>
          )}

          {/* Footer note */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span>Direct Google Identity Sync</span>
            <span>Brightloop Software Security</span>
          </div>
        </div>
      </div>
    </div>
  );
}
