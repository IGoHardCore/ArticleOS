'use client';

import { useState, useEffect } from 'react';
import { Eye, EyeOff, Save, Check, Key, Info, CheckCircle2, Zap } from 'lucide-react';
import { AppShell } from '@/components/AppShell';

function KeySection({
  title,
  description,
  hint,
  docUrl,
  docLabel,
  onSave,
  onClear,
  badge,
}: {
  title: string;
  description: string;
  hint: string;
  docUrl: string;
  docLabel: string;
  onSave: (key: string) => Promise<void>;
  onClear: () => Promise<void>;
  badge?: React.ReactNode;
}) {
  const [newKey, setNewKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (!newKey.trim()) return;
    setLoading(true);
    await onSave(newKey.trim());
    setNewKey('');
    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 2500);
  }

  const hasSaved = hint.length > 0;

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 mb-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Key size={15} className="text-blue-500" />
        <h2 className="text-sm font-semibold text-slate-800">{hasSaved ? `Replace ${title}` : title}</h2>
        {badge}
      </div>
      <p className="text-xs text-slate-400 mb-4 leading-relaxed">
        {description}{' '}
        <span className="font-mono text-blue-600">{docLabel}</span>
      </p>

      {hasSaved && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 mb-3 flex items-center gap-2">
          <CheckCircle2 size={13} className="text-emerald-500 flex-shrink-0" />
          <span className="text-xs text-emerald-700 font-mono flex-1">{hint}</span>
          <button onClick={onClear} className="text-xs text-emerald-600 hover:text-red-500 underline transition-colors flex-shrink-0">
            Clear
          </button>
        </div>
      )}

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

      {newKey && newKey.trim().length >= 10 && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-emerald-600">
          <CheckCircle2 size={12} />
          Key entered — click Save to apply
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={loading || !newKey.trim()}
        className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-colors"
      >
        {saved ? <Check size={14} /> : <Save size={14} />}
        {saved ? 'Saved!' : hasSaved ? 'Update Key' : 'Save Key'}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [mistralHint, setMistralHint] = useState('');
  const [googleHint, setGoogleHint] = useState('');
  const [activeProvider, setActiveProvider] = useState<'mistral' | 'google' | null>(null);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(async d => {
        if (d.mistral_api_key_hint) setMistralHint(d.mistral_api_key_hint);
        if (d.api_key_hint) setGoogleHint(d.api_key_hint);
        setActiveProvider(d.active_provider ?? null);

        // Migrate old localStorage keys (one-time: move to DB, then remove)
        // Using sessionStorage going forward — never persist raw keys in localStorage
        const cachedMistral = localStorage.getItem('articleos_mistral_key');
        const cachedGoogle  = localStorage.getItem('articleos_api_key');
        const toRestore: Record<string, string> = {};
        if (!d.mistral_api_key_hint && cachedMistral) { toRestore.mistral_api_key = cachedMistral; setMistralHint('••••' + cachedMistral.slice(-4)); }
        if (!d.api_key_hint && cachedGoogle)           { toRestore.api_key = cachedGoogle;          setGoogleHint('••••' + cachedGoogle.slice(-4)); }
        if (Object.keys(toRestore).length) {
          await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toRestore) });
          setActiveProvider(toRestore.mistral_api_key ? 'mistral' : 'google');
          // Remove plaintext keys from localStorage now that they're in the DB
          localStorage.removeItem('articleos_mistral_key');
          localStorage.removeItem('articleos_api_key');
        }
      });
  }, []);

  async function saveMistral(key: string) {
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mistral_api_key: key }) });
    setMistralHint('••••' + key.slice(-4));
    setActiveProvider('mistral');
  }

  async function clearMistral() {
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mistral_api_key: '' }) });
    setMistralHint('');
    setActiveProvider(googleHint ? 'google' : null);
  }

  async function saveGoogle(key: string) {
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: key }) });
    setGoogleHint('••••' + key.slice(-4));
    if (!mistralHint) setActiveProvider('google');
  }

  async function clearGoogle() {
    await fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ api_key: '' }) });
    setGoogleHint('');
    if (!mistralHint) setActiveProvider(null);
  }

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-400 mt-0.5">Configure your ArticleOS</p>
        </div>

        {activeProvider && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl px-4 py-3 mb-5 flex items-center gap-3">
            <Zap size={15} className="text-indigo-500 flex-shrink-0" />
            <p className="text-sm text-indigo-700">
              Active AI provider: <span className="font-semibold capitalize">{activeProvider === 'mistral' ? 'Mistral AI' : 'Google Gemini'}</span>
            </p>
          </div>
        )}

        <KeySection
          title="Mistral AI API Key"
          description="Get a free key at console.mistral.ai → API Keys → Create key."
          docUrl="https://console.mistral.ai"
          docLabel="console.mistral.ai"
          hint={mistralHint}
          onSave={saveMistral}
          onClear={clearMistral}
          badge={
            <span className="ml-auto text-[10px] font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
              Recommended
            </span>
          }
        />

        <KeySection
          title="Google AI Studio API Key"
          description="Get a free key at aistudio.google.com → API Keys → Create API key."
          docUrl="https://aistudio.google.com"
          docLabel="aistudio.google.com"
          hint={googleHint}
          onSave={saveGoogle}
          onClear={clearGoogle}
        />

        <div className="bg-white border border-slate-100 rounded-2xl p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <Info size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-slate-500 space-y-1.5 leading-relaxed">
              <p><span className="text-slate-700 font-medium">Provider priority:</span> If both keys are saved, Mistral is used. Remove the Mistral key to switch to Google.</p>
              <p><span className="text-slate-700 font-medium">Mistral free tier:</span> mistral-small-latest — generous free quota, no credit card required.</p>
              <p><span className="text-slate-700 font-medium">Google free tier:</span> gemini-2.0-flash with automatic fallback to flash-lite and 1.5-flash if quota is hit.</p>
              <p><span className="text-slate-700 font-medium">Recommendations:</span> Rate articles (Skip → Must Read). The algorithm tracks which topics you rate highest.</p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
