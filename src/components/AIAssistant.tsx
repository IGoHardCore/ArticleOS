'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Loader2, Trash2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const STARTERS = [
  'What are the latest FDA approvals?',
  'Explain drug-drug interactions with warfarin',
  'What is the mechanism of GLP-1 agonists?',
  'Summarize key oncology breakthroughs this year',
];

interface AIAssistantProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AIAssistant({ open: controlledOpen, onOpenChange }: AIAssistantProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  function setOpen(val: boolean) {
    if (onOpenChange) onOpenChange(val);
    else setInternalOpen(val);
  }

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener('articleos-open-ai', handler);
    return () => window.removeEventListener('articleos-open-ai', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    setError('');
    const userMsg: Message = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: messages }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed');
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      if (msg.includes('No Google AI Studio API key')) {
        setError('No API key configured. Go to Settings to add your Google AI Studio key.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  const isControlled = controlledOpen !== undefined;

  return (
    <>
      {/* Fixed top-right toggle button */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(!open)}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-200/60 text-sm font-semibold transition-colors"
      >
        <Sparkles size={14} />
        AI
        {messages.length > 0 && (
          <span className="bg-white/25 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">
            {messages.filter(m => m.role === 'assistant').length}
          </span>
        )}
      </motion.button>

      {/* Backdrop — only shown in overlay (uncontrolled) mode */}
      <AnimatePresence>
        {open && !isControlled && (
          <motion.div
            key="ai-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Panel — fixed overlay in uncontrolled mode, inline when controlled */}
      <AnimatePresence>
        {open && !isControlled && (
          <motion.div
            key="ai-panel-overlay"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-screen w-[340px] bg-white shadow-2xl border-l border-slate-100 z-50 flex flex-col"
          >
            <PanelContent
              messages={messages}
              input={input}
              loading={loading}
              error={error}
              inputRef={inputRef}
              bottomRef={bottomRef}
              onInput={setInput}
              onSend={send}
              onClose={() => setOpen(false)}
              onClear={() => setMessages([])}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline panel used when parent controls layout */}
      {isControlled && (
        <motion.div
          animate={{ width: open ? 340 : 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 34 }}
          className="flex-shrink-0 overflow-hidden border-l border-slate-100 bg-white"
          style={{ minWidth: 0 }}
        >
          {open && (
            <div className="w-[340px] h-full flex flex-col">
              <PanelContent
                messages={messages}
                input={input}
                loading={loading}
                error={error}
                inputRef={inputRef}
                bottomRef={bottomRef}
                onInput={setInput}
                onSend={send}
                onClose={() => setOpen(false)}
                onClear={() => setMessages([])}
              />
            </div>
          )}
        </motion.div>
      )}
    </>
  );
}

interface PanelContentProps {
  messages: Message[];
  input: string;
  loading: boolean;
  error: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  onInput: (val: string) => void;
  onSend: (text?: string) => void;
  onClose: () => void;
  onClear: () => void;
}

function PanelContent({ messages, input, loading, error, inputRef, bottomRef, onInput, onSend, onClose, onClear }: PanelContentProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center">
            <Sparkles size={13} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800 leading-tight">Medical AI</p>
            <p className="text-[10px] text-slate-400">Powered by Gemini</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button
              onClick={onClear}
              title="Clear chat"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <Trash2 size={13} />
            </button>
          )}
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div>
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                <Sparkles size={20} className="text-indigo-500" />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">Medical AI Assistant</p>
              <p className="text-xs text-slate-400 leading-relaxed">Ask anything about drugs, clinical research, pharmacology, or patient care.</p>
            </div>
            <div className="space-y-1.5 mt-2">
              {STARTERS.map(s => (
                <button
                  key={s}
                  onClick={() => onSend(s)}
                  className="w-full text-left px-3 py-2 rounded-xl bg-slate-50 hover:bg-indigo-50 hover:text-indigo-700 text-xs text-slate-600 border border-slate-100 hover:border-indigo-200 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[88%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed break-words overflow-hidden ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-sm'
                  : 'bg-slate-100 text-slate-800 rounded-tl-sm'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 px-3.5 py-2.5 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-xs text-red-600">
            {error}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-100 flex-shrink-0">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={e => onInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); } }}
            placeholder="Ask a medical question…"
            disabled={loading}
            className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-60"
          />
          <button
            onClick={() => onSend()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors disabled:opacity-40 flex-shrink-0"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          </button>
        </div>
      </div>
    </>
  );
}
