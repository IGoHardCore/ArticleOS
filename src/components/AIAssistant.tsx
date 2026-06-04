'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, Loader2, Trash2, History, Plus, ArrowLeft } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  preview: string;
  message_count: number;
}

const STARTERS = [
  'What research themes keep coming up in my reading?',
  "Help me structure a thesis argument based on what I've been reading",
  'What questions should I be asking about my top topics?',
  'What are the gaps or controversies in what I\'ve been studying?',
];

const MIN_WIDTH = 300;
const MAX_WIDTH = 720;
const DEFAULT_WIDTH = 400;

function generateTitle(messages: Message[]): string {
  const first = messages.find(m => m.role === 'user');
  if (!first) return 'New Chat';
  const t = first.content.trim();
  if (t.length <= 55) return t;
  const cut = t.slice(0, 55);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 20 ? cut.slice(0, lastSpace) : cut) + '…';
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

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
  const [panelWidth, setPanelWidth] = useState(DEFAULT_WIDTH);
  const [panelView, setPanelView] = useState<'chat' | 'history'>('chat');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const isResizing = useRef(false);
  const lastSavedCount = useRef(0);
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

  // Auto-save after each completed exchange
  useEffect(() => {
    if (loading) return;
    if (messages.length < 2) return;
    const last = messages[messages.length - 1];
    if (last.role !== 'assistant' || !last.content) return;
    if (messages.length <= lastSavedCount.current) return;
    lastSavedCount.current = messages.length;
    saveSession(messages, sessionId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  async function saveSession(msgs: Message[], existingId: string | null) {
    const title = generateTitle(msgs);
    try {
      if (existingId) {
        await fetch(`/api/chat-sessions/${existingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, messages: msgs }),
        });
      } else {
        const res = await fetch('/api/chat-sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, messages: msgs }),
        });
        const data = await res.json();
        if (data.id) setSessionId(data.id);
      }
    } catch {
      // non-blocking — don't surface save errors to user
    }
  }

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await fetch('/api/chat-sessions');
      const data = await res.json();
      setSessions(data.sessions ?? []);
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  async function openHistory() {
    setPanelView('history');
    loadSessions();
  }

  async function loadSession(id: string) {
    const res = await fetch(`/api/chat-sessions/${id}`);
    const data = await res.json();
    if (data.session) {
      setMessages(data.session.messages ?? []);
      setSessionId(id);
      lastSavedCount.current = (data.session.messages ?? []).length;
      setPanelView('chat');
    }
  }

  async function deleteSession(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    await fetch(`/api/chat-sessions/${id}`, { method: 'DELETE' });
    setSessions(prev => prev.filter(s => s.id !== id));
    if (sessionId === id) newChat();
  }

  function newChat() {
    setMessages([]);
    setSessionId(null);
    setInput('');
    setError('');
    lastSavedCount.current = 0;
    setPanelView('chat');
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // Drag-to-resize
  const startResize = useCallback((e: React.MouseEvent) => {
    isResizing.current = true;
    e.preventDefault();
    const onMove = (ev: MouseEvent) => {
      if (!isResizing.current) return;
      setPanelWidth(Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, window.innerWidth - ev.clientX)));
    };
    const onUp = () => {
      isResizing.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, []);

  async function send(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    setError('');
    const userMsg: Message = { role: 'user', content: msg };
    const historySnapshot = [...messages];
    setMessages(prev => [...prev, userMsg, { role: 'assistant', content: '' }]);
    setLoading(true);
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history: historySnapshot }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Request failed');
      }
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: accumulated };
          return updated;
        });
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Something went wrong';
      setMessages(prev => prev.slice(0, -1));
      if (errMsg.includes('No AI API key') || errMsg.includes('No Google AI Studio')) {
        setError('No API key configured. Go to Settings to add your Mistral or Google key.');
      } else {
        setError(errMsg);
      }
    } finally {
      setLoading(false);
    }
  }

  const isControlled = controlledOpen !== undefined;

  const panelContent = (
    <PanelContent
      messages={messages}
      input={input}
      loading={loading}
      error={error}
      panelView={panelView}
      sessions={sessions}
      sessionsLoading={sessionsLoading}
      sessionId={sessionId}
      inputRef={inputRef}
      bottomRef={bottomRef}
      onInput={setInput}
      onSend={send}
      onClose={() => setOpen(false)}
      onClear={newChat}
      onOpenHistory={openHistory}
      onCloseHistory={() => setPanelView('chat')}
      onLoadSession={loadSession}
      onDeleteSession={deleteSession}
      onNewChat={newChat}
    />
  );

  return (
    <>
      {/* Toggle button */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(!open)}
        className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-200/60 text-sm font-semibold transition-colors md:flex hidden"
      >
        <Sparkles size={14} />
        AI
        {messages.length > 0 && (
          <span className="bg-white/25 rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none">
            {messages.filter(m => m.role === 'assistant').length}
          </span>
        )}
      </motion.button>

      {/* Backdrop */}
      <AnimatePresence>
        {open && !isControlled && (
          <motion.div
            key="ai-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-40"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Overlay panel — resizable */}
      <AnimatePresence>
        {open && !isControlled && (
          <motion.div
            key="ai-panel-overlay"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            className="fixed right-0 top-0 h-screen bg-white shadow-2xl border-l border-slate-100 z-50 flex flex-col"
            style={{ width: `min(${panelWidth}px, 100vw)` }}
          >
            <div
              onMouseDown={startResize}
              className="absolute left-0 top-0 h-full w-1.5 cursor-col-resize group z-10"
            >
              <div className="h-full w-full group-hover:bg-indigo-300/40 transition-colors" />
            </div>
            {panelContent}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline panel (controlled) */}
      {isControlled && (
        <motion.div
          animate={{ width: open ? 400 : 0 }}
          transition={{ type: 'spring', stiffness: 340, damping: 34 }}
          className="flex-shrink-0 overflow-hidden border-l border-slate-100 bg-white"
          style={{ minWidth: 0 }}
        >
          {open && <div className="w-[400px] h-full flex flex-col">{panelContent}</div>}
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
  panelView: 'chat' | 'history';
  sessions: ChatSession[];
  sessionsLoading: boolean;
  sessionId: string | null;
  inputRef: React.RefObject<HTMLInputElement | null>;
  bottomRef: React.RefObject<HTMLDivElement | null>;
  onInput: (val: string) => void;
  onSend: (text?: string) => void;
  onClose: () => void;
  onClear: () => void;
  onOpenHistory: () => void;
  onCloseHistory: () => void;
  onLoadSession: (id: string) => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onNewChat: () => void;
}

function renderMarkdown(text: string) {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, '')); i++;
      }
      elements.push(
        <ol key={i} className="list-decimal list-outside ml-5 space-y-2 my-3">
          {items.map((item, j) => <li key={j} className="leading-relaxed">{formatInline(item)}</li>)}
        </ol>
      );
      continue;
    }
    if (/^[-*•]\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•]\s/, '')); i++;
      }
      elements.push(
        <ul key={i} className="list-disc list-outside ml-5 space-y-2 my-3">
          {items.map((item, j) => <li key={j} className="leading-relaxed">{formatInline(item)}</li>)}
        </ul>
      );
      continue;
    }
    elements.push(<p key={i} className="leading-[1.75] text-slate-800">{formatInline(line)}</p>);
    i++;
  }
  return elements;
}

function formatInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>
      : part
  );
}

function PanelContent({
  messages, input, loading, error, panelView, sessions, sessionsLoading,
  inputRef, bottomRef, onInput, onSend, onClose, onOpenHistory,
  onCloseHistory, onLoadSession, onDeleteSession, onNewChat,
}: PanelContentProps) {
  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-100 flex-shrink-0">
        {panelView === 'history' ? (
          <>
            <button
              onClick={onCloseHistory}
              className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 transition-colors text-sm font-medium"
            >
              <ArrowLeft size={15} /> Back
            </button>
            <span className="text-sm font-semibold text-slate-700">Chat History</span>
            <button
              onClick={onNewChat}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
            >
              <Plus size={12} /> New
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-indigo-600 flex items-center justify-center">
                <Sparkles size={13} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 leading-tight">Research Companion</p>
                <p className="text-[10px] text-slate-400">Knows your reading history</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={onNewChat}
                title="New chat"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={onOpenHistory}
                title="Chat history"
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <History size={14} />
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* History view */}
      {panelView === 'history' && (
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {sessionsLoading ? (
            <div className="space-y-2 mt-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <History size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-400">No past chats yet</p>
              <p className="text-xs text-slate-400 mt-1">Start a conversation and it'll appear here</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {sessions.map(s => (
                <button
                  key={s.id}
                  onClick={() => onLoadSession(s.id)}
                  className="w-full text-left px-3.5 py-3 rounded-xl bg-slate-50 hover:bg-indigo-50 border border-slate-100 hover:border-indigo-200 transition-all group relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-medium text-slate-800 leading-snug line-clamp-1 flex-1 group-hover:text-indigo-700 transition-colors">
                      {s.title}
                    </p>
                    <button
                      onClick={e => onDeleteSession(s.id, e)}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-5 h-5 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-slate-400">{timeAgo(s.updated_at)}</span>
                    <span className="text-[10px] text-slate-300">·</span>
                    <span className="text-[10px] text-slate-400">{Math.floor(s.message_count / 2)} exchange{Math.floor(s.message_count / 2) !== 1 ? 's' : ''}</span>
                  </div>
                  {s.preview && (
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{s.preview}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat view */}
      {panelView === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-5 space-y-5">
            {messages.length === 0 && (
              <div>
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center mx-auto mb-3">
                    <Sparkles size={20} className="text-indigo-500" />
                  </div>
                  <p className="text-sm font-medium text-slate-700 mb-1">Research Companion</p>
                  <p className="text-xs text-slate-400 leading-relaxed">I know what you&apos;ve been reading. Let&apos;s think through your research together.</p>
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
                {m.role === 'user' ? (
                  <div className="max-w-[82%] px-4 py-3 rounded-2xl rounded-tr-sm bg-indigo-600 text-white text-sm leading-relaxed break-words">
                    {m.content}
                  </div>
                ) : (
                  <div className="max-w-[92%] text-sm break-words space-y-3">
                    {m.content
                      ? renderMarkdown(m.content)
                      : <span className="text-slate-400 animate-pulse">…</span>
                    }
                  </div>
                )}
              </div>
            ))}

            {loading && messages.length > 0 && messages[messages.length - 1].content === '' && (
              <div className="flex justify-start">
                <div className="bg-slate-100 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
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
                placeholder="Ask a question…"
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
      )}
    </>
  );
}
