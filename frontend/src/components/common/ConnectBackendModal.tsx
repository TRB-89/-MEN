import React, { useState } from 'react';
import {
  X,
  Server,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Copy,
  Terminal,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useBackend } from '../../services/BackendContext';
import { api } from '../../services/api';

interface ConnectBackendModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConnectBackendModal: React.FC<ConnectBackendModalProps> = ({ isOpen, onClose }) => {
  const {
    baseUrl,
    setCustomBaseUrl,
    resetCustomBaseUrl,
    isOnline,
    health,
    checkHealth,
  } = useBackend();

  const [inputUrl, setInputUrl] = useState<string>(baseUrl);
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'connect' | 'vercel' | 'render'>('connect');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    const target = inputUrl.trim();
    if (!target) {
      setTestStatus('error');
      setTestError('Please enter a backend URL (e.g., https://your-backend.onrender.com)');
      return;
    }

    setTestStatus('testing');
    setTestError(null);
    setTestResult(null);

    // Sanitize user entry
    let clean = target.replace(/['"]+/g, '').trim().replace(/\/+$/, '');
    if (clean.endsWith('/api')) {
      clean = clean.slice(0, -4);
    }
    if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      clean.startsWith('http://') &&
      !clean.includes('localhost') &&
      !clean.includes('127.0.0.1')
    ) {
      clean = clean.replace(/^http:\/\//, 'https://');
    }

    const startTime = performance.now();
    try {
      // Direct probe to health endpoints
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      let resp: Response;
      try {
        resp = await fetch(`${clean}/api/health`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
      } catch (e) {
        // Fallback to /health
        resp = await fetch(`${clean}/health`, {
          signal: controller.signal,
          headers: { Accept: 'application/json' },
        });
      }
      clearTimeout(timeoutId);

      const latency = Math.round(performance.now() - startTime);

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status} ${resp.statusText}`);
      }

      const data = await resp.json();
      setTestStatus('success');
      setTestResult({
        ...data,
        latencyMs: latency,
      });
    } catch (err: any) {
      const latency = Math.round(performance.now() - startTime);
      setTestStatus('error');
      if (err.name === 'AbortError') {
        setTestError(
          `Connection timed out (${latency}ms). If using Render Free Tier, the backend service may be cold-starting (~60-90s). Please wait a minute and re-test.`
        );
      } else {
        const isClientHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
        if (isClientHttps && clean.startsWith('http://') && !clean.includes('localhost')) {
          setTestError(
            `Mixed Content Blocked: HTTPS Vercel frontend cannot query insecure HTTP backend (${clean}). Please enter an HTTPS URL.`
          );
        } else {
          setTestError(
            `Failed to reach backend at ${clean}. Check that the URL is correct, the Render service is running, and CORS is enabled.`
          );
        }
      }
    }
  };

  const handleApplyAndConnect = () => {
    let clean = inputUrl.trim().replace(/['"]+/g, '').replace(/\/+$/, '');
    if (clean.endsWith('/api')) {
      clean = clean.slice(0, -4);
    }
    if (
      typeof window !== 'undefined' &&
      window.location.protocol === 'https:' &&
      clean.startsWith('http://') &&
      !clean.includes('localhost') &&
      !clean.includes('127.0.0.1')
    ) {
      clean = clean.replace(/^http:\/\//, 'https://');
    }

    setCustomBaseUrl(clean);
    onClose();
  };

  const handleReset = () => {
    resetCustomBaseUrl();
    setInputUrl(api.getBaseUrl());
    setTestStatus('idle');
    setTestResult(null);
    setTestError(null);
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in font-mono">
      <div className="relative w-full max-w-2xl bg-surface border-2 border-border shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-surface-elevated">
          <div className="flex items-center gap-2.5">
            <Server className="w-4 h-4 text-accent" />
            <span className="font-display text-sm font-bold tracking-tight text-chrome uppercase">
              // BACKEND CONNECTION CONFIGURATION
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-chrome transition-colors p-1"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Status Bar */}
        <div className="px-6 py-3 border-b border-border bg-background flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted uppercase text-[10px]">CURRENT STATUS:</span>
            <div className="flex items-center gap-1.5 font-bold">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline ? 'bg-success animate-pulse' : 'bg-critical'
                }`}
              />
              <span className={isOnline ? 'text-success' : 'text-critical'}>
                {isOnline ? 'CONNECTED & READY' : 'OFFLINE / UNREACHABLE'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-muted text-[11px] truncate max-w-full">
            <span>TARGET:</span>
            <code className="text-chrome font-bold truncate">{baseUrl}</code>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-surface px-6 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('connect')}
            className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
              activeTab === 'connect'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-chrome'
            }`}
          >
            QUICK CONNECT (LIVE OVERRIDE)
          </button>
          <button
            onClick={() => setActiveTab('vercel')}
            className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
              activeTab === 'vercel'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-chrome'
            }`}
          >
            PERMANENT VERCEL SETUP
          </button>
          <button
            onClick={() => setActiveTab('render')}
            className={`px-4 py-2 border-b-2 font-semibold transition-colors ${
              activeTab === 'render'
                ? 'border-accent text-accent'
                : 'border-transparent text-muted hover:text-chrome'
            }`}
          >
            RENDER DEPLOYMENT GUIDE
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
          {activeTab === 'connect' && (
            <div className="space-y-4">
              <p className="text-muted text-xs leading-relaxed">
                Connect this Vercel frontend to your live FastAPI backend. Enter your live backend URL
                (e.g., from <strong className="text-chrome">Render</strong>, <strong className="text-chrome">Railway</strong>, or <strong className="text-chrome">Koyeb</strong>)
                below. You can test the connection in real time and save it instantly to your browser session.
              </p>

              {/* URL Input Box */}
              <div className="space-y-2">
                <label className="text-[11px] uppercase tracking-wider text-muted font-bold block">
                  BACKEND API BASE URL
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="flex-1 flex items-center border border-border bg-background px-3 py-2">
                    <Terminal className="w-3.5 h-3.5 text-muted mr-2 shrink-0" />
                    <input
                      type="text"
                      value={inputUrl}
                      onChange={(e) => {
                        setInputUrl(e.target.value);
                        setTestStatus('idle');
                      }}
                      placeholder="https://your-backend.onrender.com"
                      className="w-full bg-transparent text-chrome font-mono text-xs focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    disabled={testStatus === 'testing'}
                    className="px-4 py-2 bg-surface-elevated hover:bg-surface border border-border text-chrome hover:border-chrome text-xs font-semibold uppercase flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                    <span>{testStatus === 'testing' ? 'TESTING...' : 'TEST PING'}</span>
                  </button>
                </div>
                <span className="text-[10px] text-muted block">
                  Do not include <code>/api</code> or trailing slash. Mixed content rule: Vercel requires HTTPS.
                </span>
              </div>

              {/* Test Connection Results */}
              {testStatus === 'success' && testResult && (
                <div className="p-3 bg-success/10 border border-success/40 space-y-1.5">
                  <div className="flex items-center gap-2 text-success font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>CONNECTION SUCCESSFUL ({testResult.latencyMs}ms)</span>
                  </div>
                  <div className="text-[11px] text-chrome space-y-0.5">
                    <div>Status: <span className="text-success font-semibold">{testResult.status}</span></div>
                    <div>Model Loaded: <span className="text-success font-semibold">{String(testResult.model_loaded)}</span></div>
                    <div>Model Version: <span className="font-semibold">{testResult.model_version}</span></div>
                    <div>Runtime Device: <span className="font-semibold">{testResult.device}</span></div>
                  </div>
                </div>
              )}

              {testStatus === 'error' && (
                <div className="p-3 bg-critical/10 border border-critical/40 space-y-1.5">
                  <div className="flex items-center gap-2 text-critical font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>CONNECTION FAILED</span>
                  </div>
                  <p className="text-[11px] text-critical/90 leading-relaxed">{testError}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-border">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-3 py-1.5 border border-border text-muted hover:text-chrome text-xs uppercase"
                >
                  RESET TO DEFAULT
                </button>
                <button
                  type="button"
                  onClick={handleApplyAndConnect}
                  className="px-5 py-2 bg-accent hover:bg-accent-hover text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>SAVE & CONNECT NOW</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'vercel' && (
            <div className="space-y-4">
              <p className="text-muted leading-relaxed">
                To permanently connect your Vercel deployment so that every user automatically reaches your backend, configure the environment variable in Vercel:
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-surface-elevated border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-chrome uppercase">
                      1. ENVIRONMENT VARIABLE NAME
                    </span>
                    <button
                      onClick={() => copyToClipboard('VITE_API_BASE_URL', 'key')}
                      className="text-[10px] text-accent hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === 'key' ? 'COPIED!' : 'COPY'}</span>
                    </button>
                  </div>
                  <code className="block bg-background p-2 text-accent border border-border text-xs font-bold">
                    VITE_API_BASE_URL
                  </code>
                </div>

                <div className="p-3 bg-surface-elevated border border-border space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-chrome uppercase">
                      2. VALUE (YOUR LIVE BACKEND URL)
                    </span>
                    <button
                      onClick={() => copyToClipboard('https://your-backend.onrender.com', 'val')}
                      className="text-[10px] text-accent hover:underline flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === 'val' ? 'COPIED EXAMPLE!' : 'COPY EXAMPLE'}</span>
                    </button>
                  </div>
                  <code className="block bg-background p-2 text-chrome border border-border text-xs">
                    https://your-backend-name.onrender.com
                  </code>
                  <span className="text-[10px] text-muted">
                    Must use HTTPS and have no trailing slash or <code>/api</code>.
                  </span>
                </div>

                <div className="p-3.5 bg-critical/10 border border-critical/40 space-y-2">
                  <div className="flex items-center gap-2 text-critical font-bold text-xs uppercase">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>CRITICAL STEP: TRIGGER REDEPLOY ON VERCEL</span>
                  </div>
                  <p className="text-muted text-[11px] leading-relaxed">
                    Vite embeds <code className="text-chrome">VITE_*</code> environment variables into the static JavaScript bundles <strong className="text-chrome">during build time</strong>.
                    Adding the variable in Vercel settings will <strong className="text-critical underline">NOT</strong> take effect until you trigger a new build!
                  </p>
                  <p className="text-chrome text-[11px]">
                    Go to Vercel Dashboard → Your Project → <strong>Deployments</strong> → click <strong>...</strong> on the latest deployment → click <strong>Redeploy</strong>.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'render' && (
            <div className="space-y-4">
              <p className="text-muted leading-relaxed">
                Why can't FastAPI + PyTorch run directly on Vercel? Vercel Serverless Functions have a maximum size limit of 250 MB.
                PyTorch and machine learning libraries exceed this limit, which is why the backend runs on <strong className="text-chrome">Render</strong> or <strong className="text-chrome">Railway</strong>.
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-surface-elevated border border-border space-y-1.5">
                  <span className="text-[11px] font-bold text-chrome uppercase block">
                    STEP 1: 1-CLICK BLUEPRINT ON RENDER
                  </span>
                  <p className="text-muted text-[11px]">
                    In <a href="https://dashboard.render.com" target="_blank" rel="noreferrer" className="text-accent underline inline-flex items-center gap-1">Render Dashboard <ExternalLink className="w-2.5 h-2.5" /></a>,
                    click <strong>New +</strong> → <strong>Blueprint</strong>, and select this repository. Render automatically reads <code>render.yaml</code>.
                  </p>
                </div>

                <div className="p-3 bg-surface-elevated border border-border space-y-1.5">
                  <span className="text-[11px] font-bold text-chrome uppercase block">
                    STEP 2: VERIFY CORS ENVIRONMENT VARIABLE
                  </span>
                  <p className="text-muted text-[11px]">
                    On Render, make sure the following environment variable is set so your Vercel domain is permitted:
                  </p>
                  <div className="p-2 bg-background border border-border space-y-1">
                    <div className="text-[10px] text-muted">KEY: <code className="text-accent">CORS_ORIGIN_REGEX</code></div>
                    <div className="text-[10px] text-muted">VALUE: <code className="text-chrome">^https://.*\.vercel\.app$</code></div>
                  </div>
                </div>

                <div className="p-3 bg-surface-elevated border border-border space-y-1.5">
                  <span className="text-[11px] font-bold text-chrome uppercase block">
                    STEP 3: RENDER FREE TIER COLD STARTS
                  </span>
                  <p className="text-muted text-[11px]">
                    Free tier services spin down after 15 minutes of inactivity. When spinning up, the first request takes ~60–90 seconds.
                    The NØX UI includes an automatic wake-up sequence and retry button.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-border bg-surface-elevated flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-muted">
            <ShieldCheck className="w-3.5 h-3.5 text-accent" />
            <span>NØX Neural Detection IDS</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-border hover:border-chrome text-chrome transition-colors"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
