'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, Check, Key, Info } from 'lucide-react';
import { Sidebar } from '@/components/Sidebar';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/settings').then(r => r.json()).then(d => {
      if (d.api_key) setApiKey(d.api_key);
    });
  }, []);

  async function saveSettings() {
    setLoading(true);
    await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: apiKey }),
    });
    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-100">Settings</h1>
            <p className="text-sm text-slate-500 mt-0.5">Configure your ArticleOS</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Key size={16} className="text-indigo-400" />
              <h2 className="text-sm font-semibold text-slate-200">Anthropic API Key</h2>
            </div>
            <p className="text-xs text-slate-500 mb-4">Used to generate AI summaries and article tags. Your key is stored locally.</p>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="sk-ant-..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pr-12 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 font-mono"
              />
              <button onClick={() => setShowKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              onClick={saveSettings}
              disabled={loading || !apiKey}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {saved ? <Check size={14} /> : <Save size={14} />}
              {saved ? 'Saved!' : 'Save Key'}
            </button>
          </div>
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Info size={16} className="text-slate-500 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-500 space-y-1.5">
                <p><span className="text-slate-400 font-medium">How it works:</span> When you refresh your feed, ArticleOS scrapes 15 medical news sources and uses Claude to generate plain-English summaries and tag each article by topic.</p>
                <p><span className="text-slate-400 font-medium">Recommendations:</span> Rate articles with stars. The algorithm tracks which topics you rate highest and surfaces more of that content.</p>
                <p><span className="text-slate-400 font-medium">Top Pick:</span> Updated weekly and monthly based on your highest-rated articles.</p>
                <p><span className="text-slate-400 font-medium">Research:</span> The AI Research Guidance feature uses your notes and interests to give you actionable next steps.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
