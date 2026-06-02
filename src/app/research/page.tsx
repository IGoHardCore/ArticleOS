'use client';

import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Brain, ChevronDown, ChevronUp,
  CheckCircle2, Circle, PauseCircle,
} from 'lucide-react';
import { NavRail } from '@/components/NavRail';
import { AIAssistant } from '@/components/AIAssistant';
import { cn } from '@/lib/utils';

interface Note {
  id: number;
  title: string;
  content: string;
  status: 'active' | 'done' | 'paused';
  priority: 'high' | 'medium' | 'low';
  tags: string[];
  linked_articles: number[];
  created_at: string;
  updated_at: string;
}

const STATUS_ICONS = {
  active: Circle,
  done: CheckCircle2,
  paused: PauseCircle,
};

const STATUS_COLORS = {
  active: 'text-indigo-500',
  done: 'text-emerald-500',
  paused: 'text-slate-400',
};

const PRIORITY_COLORS = {
  high: 'bg-red-50 text-red-600 border-red-100',
  medium: 'bg-amber-50 text-amber-600 border-amber-100',
  low: 'bg-slate-100 text-slate-500 border-slate-200',
};

export default function ResearchPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    status: 'active' as Note['status'],
    priority: 'medium' as Note['priority'],
    tags: [] as string[],
  });

  async function fetchNotes() {
    const res = await fetch('/api/research');
    const data = await res.json();
    setNotes(data.notes || []);
    setLoading(false);
  }

  useEffect(() => {
    fetchNotes();
    fetch('/api/tags').then(r => r.json()).then(d => setAllTags((d.tags || []).map((t: { name: string }) => t.name)));
  }, []);

  async function createNote() {
    if (!newNote.title.trim()) return;
    const res = await fetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newNote),
    });
    if (!res.ok) return;
    setNewNote({ title: '', content: '', status: 'active', priority: 'medium', tags: [] });
    setCreating(false);
    fetchNotes();
  }

  async function updateNote(note: Note) {
    const res = await fetch('/api/research', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note),
    });
    if (res.ok) fetchNotes();
  }

  async function deleteNote(id: number) {
    const res = await fetch('/api/research', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchNotes();
  }

  const active = notes.filter(n => n.status === 'active');
  const paused = notes.filter(n => n.status === 'paused');
  const done = notes.filter(n => n.status === 'done');

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <NavRail />
      <main className="flex-1 ml-16 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-6">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Research Directory</h1>
              <p className="text-sm text-slate-500 mt-0.5">Track your research goals and get AI guidance</p>
            </div>
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors"
            >
              <Plus size={14} /> New Note
            </button>
          </div>

          {creating && (
            <div className="bg-white border border-indigo-200 rounded-2xl p-5 mb-6 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800 mb-4">New Research Note</h3>
              <input
                autoFocus
                type="text"
                placeholder="Research topic or goal..."
                value={newNote.title}
                onChange={e => setNewNote(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 mb-3 transition-all"
              />
              <textarea
                placeholder="Notes, context, questions..."
                value={newNote.content}
                onChange={e => setNewNote(p => ({ ...p, content: e.target.value }))}
                rows={4}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 mb-3 resize-none transition-all"
              />
              <div className="flex gap-3 mb-4">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Priority</label>
                  <select
                    value={newNote.priority}
                    onChange={e => setNewNote(p => ({ ...p, priority: e.target.value as Note['priority'] }))}
                    className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 focus:outline-none"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>
              <div className="mb-4">
                <label className="text-xs text-slate-500 mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => setNewNote(p => ({
                        ...p,
                        tags: p.tags.includes(tag) ? p.tags.filter(t => t !== tag) : [...p.tags, tag],
                      }))}
                      className={cn(
                        'px-2 py-0.5 rounded-full text-xs border transition-colors',
                        newNote.tags.includes(tag)
                          ? 'bg-indigo-100 text-indigo-700 border-indigo-200'
                          : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={createNote} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition-colors">Save Note</button>
                <button onClick={() => setCreating(false)} className="px-4 py-2 text-slate-500 hover:text-slate-800 text-sm transition-colors">Cancel</button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => <div key={i} className="bg-white border border-slate-100 rounded-2xl p-4 h-20" />)}
            </div>
          ) : (
            <div className="space-y-6">
              {active.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <Circle size={12} className="text-indigo-400" /> Active ({active.length})
                  </h2>
                  <div className="space-y-2">
                    {active.map(note => (
                      <NoteCard key={note.id} note={note} expanded={expanded === note.id}
                        onToggle={() => setExpanded(expanded === note.id ? null : note.id)}
                        onUpdate={updateNote} onDelete={deleteNote} />
                    ))}
                  </div>
                </section>
              )}
              {paused.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <PauseCircle size={12} className="text-slate-500" /> Paused ({paused.length})
                  </h2>
                  <div className="space-y-2">
                    {paused.map(note => (
                      <NoteCard key={note.id} note={note} expanded={expanded === note.id}
                        onToggle={() => setExpanded(expanded === note.id ? null : note.id)}
                        onUpdate={updateNote} onDelete={deleteNote} />
                    ))}
                  </div>
                </section>
              )}
              {done.length > 0 && (
                <section>
                  <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <CheckCircle2 size={12} className="text-emerald-400" /> Completed ({done.length})
                  </h2>
                  <div className="space-y-2">
                    {done.map(note => (
                      <NoteCard key={note.id} note={note} expanded={expanded === note.id}
                        onToggle={() => setExpanded(expanded === note.id ? null : note.id)}
                        onUpdate={updateNote} onDelete={deleteNote} />
                    ))}
                  </div>
                </section>
              )}
              {notes.length === 0 && !creating && (
                <div className="text-center py-16">
                  <Brain size={40} className="mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-500 font-medium">No research notes yet</p>
                  <p className="text-slate-400 text-sm mt-1">Create a note to start tracking your research goals</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <AIAssistant />
    </div>
  );
}

function NoteCard({ note, expanded, onToggle, onUpdate, onDelete }: {
  note: Note; expanded: boolean; onToggle: () => void;
  onUpdate: (n: Note) => void; onDelete: (id: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(note);
  const StatusIcon = STATUS_ICONS[note.status];

  return (
    <div className={cn('bg-white border rounded-2xl transition-colors shadow-sm', note.status === 'done' ? 'border-slate-100 opacity-60' : 'border-slate-100')}>
      <div className="flex items-center gap-3 px-4 py-3">
        <StatusIcon size={16} className={cn('flex-shrink-0 cursor-pointer', STATUS_COLORS[note.status])}
          onClick={() => {
            const next = note.status === 'active' ? 'done' : note.status === 'done' ? 'paused' : 'active';
            onUpdate({ ...note, status: next });
          }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={cn('text-sm font-medium', note.status === 'done' ? 'line-through text-slate-400' : 'text-slate-800')}>{note.title}</span>
            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full border font-medium', PRIORITY_COLORS[note.priority])}>{note.priority}</span>
          </div>
          {note.tags.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {note.tags.map(t => <span key={t} className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full">{t}</span>)}
            </div>
          )}
        </div>
        <button onClick={onToggle} className="text-slate-400 hover:text-slate-700 transition-colors">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
      {expanded && (
        <div className="px-4 pb-4 border-t border-slate-100 pt-3">
          {editing ? (
            <div className="space-y-3">
              <input value={draft.title} onChange={e => setDraft(p => ({ ...p, title: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
              <textarea value={draft.content} onChange={e => setDraft(p => ({ ...p, content: e.target.value }))}
                rows={5} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 resize-none transition-all" />
              <select value={draft.priority} onChange={e => setDraft(p => ({ ...p, priority: e.target.value as Note['priority'] }))}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-slate-700 focus:outline-none">
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <div className="flex gap-2">
                <button onClick={() => { onUpdate(draft); setEditing(false); }} className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-medium transition-colors">Save</button>
                <button onClick={() => { setDraft(note); setEditing(false); }} className="px-3 py-1.5 text-slate-500 hover:text-slate-800 text-xs transition-colors">Cancel</button>
              </div>
            </div>
          ) : (
            <div>
              {note.content && <p className="text-sm text-slate-600 leading-relaxed mb-3 whitespace-pre-wrap">{note.content}</p>}
              <div className="flex gap-2">
                <button onClick={() => setEditing(true)} className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors">Edit</button>
                <button onClick={() => onDelete(note.id)} className="text-xs text-red-400 hover:text-red-600 transition-colors flex items-center gap-1"><Trash2 size={11} /> Delete</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
