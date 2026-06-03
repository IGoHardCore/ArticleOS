'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, Check, Key, Info, CheckCircle2 } from 'lucide-react';
import { AppShell } from '@/components/AppShell';

export default function SettingsPage() {
  const [newKey, setNewKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [existingHint, setExistingHint] = useState('');   // "••••XXXX"
  const [hasSavedKey, setHasSavedKey] = useState(false);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(async d => {
        if (d.api_key_hint) {
          setExistingHint(d.api_key_hint);
          setHasSavedKey(true);
        } else {
          // DB was wiped (container restart) — check localStorage backup
          const cached = localStorage.getItem('articleos_api_key');
          if (cached) {
            setLoading(true);
            await fetch('/api/settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ api_key: cached }),
            });
            setHasSavedKey(true);
            setExistingHint('••••' + cached.slice(-4));
            setLoading(false);
          }
        }
      });
  }, []);

  async function saveSettings() {
    if (!newKey.trim()) return;
    setLoading(true);
    const key = newKey.trim();
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: key }),
    });
    // Persist to localStorage so it survives container restarts
    localStorage.setItem('articleos_api_key', key);
    setHasSavedKey(true);
    setExistingHint('••••' + key.slice(-4));
    setNewKey('');
    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 2500);
  }

  async function clearKey() {
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: '' }),
    });
    localStorage.removeItem('articleos_api_key');
    setHasSavedKey(false);
    setExistingHint('');
    setNewKey('');
  }

  return (
    <AppShell>
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-400 mt-0.5">Configure your ArticleOS</p>
          </div>

          {/* Current key status */}
          {hasSavedKey && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 mb-4 flex items-center gap-3">
              <CheckCircle2 size={16} className="text-emerald-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-700">Google AI Studio key saved</p>
                <p className="text-xs text-emerald-600 font-mono">{existingHint}</p>
              </div>
              <button onClick={clearKey} className="text-xs text-emerald-600 hover:text-red-500 underline transition-colors flex-shrink-0">
                Clear
              </button>
            </div>
          )}

          <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Key size={15} className="text-blue-500" />
              <h2 className="text-sm font-semibold text-slate-800">
                {hasSavedKey ? 'Replace API Key' : 'Google AI Studio API Key'}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Get a free key at <span className="font-mono text-blue-600">aistudio.google.com</span> → API Keys → Create API key.
            </p>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="Paste your API key…"
                value={newKey}
                onChange={e => setNewKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 font-mono transition-all"
              />
              <button
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Live validation — just check minimum length */}
            {newKey && newKey.trim().length >= 10 && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600">
                <CheckCircle2 size={12} />
                Key entered — click Save to apply
              </div>
            )}

            <button
              onClick={saveSettings}
              disabled={loading || !newKey.trim()}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {saved ? <Check size={14} /> : <Save size={14} />}
              {saved ? 'Saved!' : hasSavedKey ? 'Update Key' : 'Save Key'}
            </button>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Info size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-500 space-y-1.5 leading-relaxed">
                <p><span className="text-slate-700 font-medium">AI provider:</span> ArticleOS uses Google Gemini 1.5 Flash for article summaries, tags, research guidance, and the AI chat assistant.</p>
                <p><span className="text-slate-700 font-medium">Recommendations:</span> Rate articles (Skip → Must Read). The algorithm tracks which topics you rate highest and surfaces more of that content.</p>
                <p><span className="text-slate-700 font-medium">Top Pick:</span> Updated weekly and monthly based on your highest-rated articles in that period.</p>
                <p><span className="text-slate-700 font-medium">Free tier:</span> Google AI Studio offers a generous free tier. No credit card required for personal use.</p>
              </div>
            </div>
          </div>
        </div>
    </AppShell>
  );
}
