import React, { useState, useEffect } from 'react';
import { 
  Server, CheckCircle2, AlertCircle, RefreshCw, 
  ExternalLink, X, Globe, Zap, Database
} from 'lucide-react';
import { getApiBaseUrl, setCustomApiBaseUrl, testBackendConnection } from '../../api/client';
import { useStore } from '../../store/useStore';

interface BackendConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
}

export const BackendConfigModal: React.FC<BackendConfigModalProps> = ({ isOpen, onClose, onConnected }) => {
  const [urlInput, setUrlInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const setModelAvailable = useStore(state => state.setModelAvailable);

  useEffect(() => {
    if (isOpen) {
      setUrlInput(getApiBaseUrl());
      setTestResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentActiveUrl = getApiBaseUrl() || '(Local / Default Proxy)';

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await testBackendConnection(urlInput);
    setTesting(false);
    setTestResult(result);
    if (result.ok && result.modelAvailable !== undefined) {
      setModelAvailable(result.modelAvailable);
    }
  };

  const handleSave = async () => {
    setTesting(true);
    const result = await testBackendConnection(urlInput);
    setTesting(false);
    setTestResult(result);

    if (result.ok) {
      setCustomApiBaseUrl(urlInput);
      if (result.modelAvailable !== undefined) {
        setModelAvailable(result.modelAvailable);
      }
      if (onConnected) {
        onConnected();
      }
      setTimeout(() => {
        onClose();
      }, 700);
    }
  };

  const handleReset = () => {
    setCustomApiBaseUrl('');
    setUrlInput('');
    setTestResult(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/10 text-cyan-600 flex items-center justify-center">
              <Server size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Backend API Connection</h3>
              <p className="text-xs text-slate-500">Configure Railway or custom backend service</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Current Active Endpoint
            </label>
            <div className="px-3 py-2 bg-slate-100 rounded-lg text-xs font-mono text-slate-700 truncate border border-slate-200/80 flex items-center gap-2">
              <Globe size={14} className="text-slate-400 shrink-0" />
              <span className="truncate">{currentActiveUrl}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Railway Backend URL
            </label>
            <div className="relative">
              <input
                type="url"
                placeholder="https://your-backend.up.railway.app"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 shadow-xs"
              />
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              Paste the public URL from your Railway service (Settings → Networking).
            </p>
          </div>

          {/* Test feedback */}
          {testResult && (
            <div className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              testResult.ok 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {testResult.ok ? (
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold">{testResult.ok ? 'Connection Successful!' : 'Connection Failed'}</span>
                <p className="text-[11px] opacity-90 mt-0.5">{testResult.message}</p>
              </div>
            </div>
          )}

          {/* Vercel Tip Card */}
          <div className="p-3.5 bg-cyan-50/70 border border-cyan-200/60 rounded-xl text-xs text-cyan-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-cyan-800">
              <Zap size={14} className="text-cyan-600" />
              <span>Permanent Vercel Configuration</span>
            </div>
            <p className="text-[11px] text-cyan-800/80 leading-relaxed">
              To configure this automatically for all visitors on Vercel, set Environment Variable in Vercel:
            </p>
            <code className="block px-2.5 py-1 bg-white border border-cyan-200 rounded font-mono text-[11px] text-cyan-900 select-all">
              VITE_API_URL=https://your-backend.up.railway.app
            </code>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
          >
            Reset Default
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={testing}
              onClick={handleTest}
              className="px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200/70 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={testing ? 'animate-spin' : ''} />
              Test
            </button>
            <button
              type="button"
              disabled={testing}
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg shadow-xs shadow-cyan-600/20 transition-all flex items-center gap-1.5"
            >
              {testing ? <RefreshCw size={12} className="animate-spin" /> : <CheckCircle2 size={13} />}
              Save & Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackendConfigModal;
