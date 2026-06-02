'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Brain, Loader2, Sparkles, X } from 'lucide-react';

interface AIPanelProps {
  open: boolean;
  onClose: () => void;
  onRefreshFeed: () => void;
  refreshing?: boolean;
}

export function AIPanel({ open, onClose, onRefreshFeed, refreshing }: AIPanelProps) {
  const [guidance, setGuidance] = useState('');
  const [guidanceLoading, setGuidanceLoading] = useState(false);

  async function getGuidance() {
    setGuidanceLoading(true);
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'guidance' }),
      });
      const data = await res.json();
      setGuidance(data.guidance || '');
    } catch {
      setGuidance('Failed to get guidance. Make sure your API key is configured in Settings.');
    } finally {
      setGuidanceLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="ai-panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed right-0 top-0 h-screen w-80 bg-white border-l border-slate-100 shadow-xl z-20 flex flex-col"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-500" />
              <span className="font-semibold text-slate-800 text-sm">AI Assistant</span>
            </div>
            <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors">
              <X size={15} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {/* Refresh Feed */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <h3 className="text-xs font-semibold text-slate-700 mb-1">Feed</h3>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">Fetch the latest medical news articles from RSS sources and run AI analysis.</p>
              <button
                onClick={onRefreshFeed}
                disabled={refreshing}
                className="flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
              >
                {refreshing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                {refreshing ? 'Refreshing…' : 'Refresh Feed'}
              </button>
            </div>

            {/* Research Guidance */}
            <div className="bg-purple-50 rounded-2xl p-4 border border-purple-100">
              <h3 className="text-xs font-semibold text-purple-700 mb-1">Research Guidance</h3>
              <p className="text-xs text-slate-500 mb-3 leading-relaxed">Get personalized AI guidance based on your research notes and reading habits.</p>
              <button
                onClick={getGuidance}
                disabled={guidanceLoading}
                className="flex items-center gap-2 w-full justify-center px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-60"
              >
                {guidanceLoading ? <Loader2 size={14} className="animate-spin" /> : <Brain size={14} />}
                {guidanceLoading ? 'Thinking…' : 'Get Guidance'}
              </button>
            </div>

            {guidance && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm"
              >
                <div className="flex items-center gap-1.5 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <span className="text-xs font-semibold text-purple-600 uppercase tracking-wide">Guidance</span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{guidance}</p>
              </motion.div>
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
