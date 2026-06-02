'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, Check, Key, Info, Zap } from 'lucide-react';
import { NavRail } from '@/components/NavRail';

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
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <NavRail />
      <main className="flex-1 ml-16 overflow-y-auto">
        <div className="max-w-xl mx-auto px-6 py-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-400 mt-0.5">Configure your ArticleOS</p>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Key size={15} className="text-indigo-500" />
              <h2 className="text-sm font-semibold text-slate-800">AI API Key</h2>
            </div>
            <p className="text-xs text-slate-400 mb-3">Used to generate AI summaries and article tags. Paste either key — ArticleOS auto-detects the provider.</p>

            {/* Provider badges */}
            <div className="flex gap-2 mb-4">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${apiKey.startsWith('AIza') ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                <Zap size={10} />
                Google Gemini
              </div>
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${apiKey && !apiKey.startsWith('AIza') ? 'bg-orange-50 text-orange-600 border-orange-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                <Zap size={10} />
                Anthropic Claude
              </div>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="sk-ant-... or AIza..."
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 pr-12 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 font-mono transition-all"
              />
              <button
                onClick={() => setShowKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button
              onClick={saveSettings}
              disabled={loading || !apiKey}
              className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
            >
              {saved ? <Check size={14} /> : <Save size={14} />}
              {saved ? 'Saved!' : 'Save Key'}
            </button>
          </div>

          {/* Provider info */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-blue-700 mb-1">Google AI Studio</p>
              <p className="text-xs text-blue-600 leading-relaxed">Get a free key at <span className="font-mono">aistudio.google.com</span>. Key starts with <span className="font-mono">AIza</span>. Uses Gemini 2.0 Flash.</p>
            </div>
            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
              <p className="text-xs font-semibold text-orange-700 mb-1">Anthropic Claude</p>
              <p className="text-xs text-orange-600 leading-relaxed">Get a key at <span className="font-mono">console.anthropic.com</span>. Key starts with <span className="font-mono">sk-ant-</span>. Uses Claude Sonnet.</p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <Info size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-slate-500 space-y-1.5 leading-relaxed">
                <p><span className="text-slate-700 font-medium">How it works:</span> When you refresh your feed, ArticleOS scrapes 15 medical news sources and uses AI to generate plain-English summaries and tag each article by topic.</p>
                <p><span className="text-slate-700 font-medium">Recommendations:</span> Rate articles (Skip → Must Read). The algorithm tracks which topics you rate highest and surfaces more of that content.</p>
                <p><span className="text-slate-700 font-medium">Top Pick:</span> Updated weekly and monthly based on your highest-rated articles in that period.</p>
                <p><span className="text-slate-700 font-medium">Research:</span> The AI Guidance feature uses your research notes and reading interests to give you actionable next steps.</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
