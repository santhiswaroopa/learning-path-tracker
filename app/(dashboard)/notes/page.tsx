'use client';

import { useState, useEffect } from 'react';
import NoteCard from '@/components/ui/NoteCard';
import { SearchIcon, PlusIcon, StickyNoteIcon, BookOpenIcon } from '@/components/icons';
import type { Note, Topic } from '@/types';

function groupByDate(notesList: Note[]) {
  const groups: Record<string, Note[]> = {};
  notesList.forEach((n) => {
    const key = new Date(n.createdAt).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });
  return groups;
}

export default function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch]   = useState('');
  const [topicId, setTopicId] = useState(0);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTopicId, setNewTopicId] = useState<number>(0);
  const [newContent, setNewContent] = useState('');
  const [isImportant, setIsImportant] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch Notes and Topics
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const [notesRes, topicsRes] = await Promise.all([
          fetch('/api/notes'),
          fetch('/api/topics'),
        ]);

        if (!notesRes.ok || !topicsRes.ok) {
          throw new Error('Failed to load notes or topics');
        }

        const notesData = await notesRes.json();
        const topicsData = await topicsRes.json();

        setNotes(notesData);
        setTopics(topicsData);
        if (topicsData.length > 0) {
          setNewTopicId(topicsData[0].id);
        }
        setError(null);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Something went wrong');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Filter Notes
  const filtered = notes.filter((n) => {
    const matchSearch = n.content.toLowerCase().includes(search.toLowerCase()) ||
      n.topic.title.toLowerCase().includes(search.toLowerCase());
    const matchTopic  = topicId === 0 || n.topicId === topicId;
    return matchSearch && matchTopic;
  });

  const grouped = groupByDate(filtered);

  // Add Note Submit
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicId) {
      setSubmitError('Please select a topic');
      return;
    }
    if (!newContent.trim()) {
      setSubmitError('Note content is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topicId: newTopicId,
          content: newContent,
          isImportant,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create note');
      }

      const createdNote = await res.json();

      // Optimistic update of UI
      setNotes((prev) => [createdNote, ...prev]);

      // Reset Form and Modal
      setNewContent('');
      setIsImportant(false);
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Failed to add note');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Note Importance
  const handleToggleNoteImportance = async (noteId: number, currentVal: boolean) => {
    // Optimistic Update
    setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, isImportant: !currentVal } : n));

    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isImportant: !currentVal }),
      });
      if (!res.ok) throw new Error('Failed to toggle note importance');
    } catch (err) {
      console.error(err);
      // Revert
      setNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, isImportant: currentVal } : n));
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId: number) => {
    // Optimistic Update
    setNotes((prev) => prev.filter((n) => n.id !== noteId));

    try {
      const res = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete note');
    } catch (err) {
      console.error(err);
      // Re-fetch list
      const res = await fetch('/api/notes');
      if (res.ok) setNotes(await res.json());
    }
  };


  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Notes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading ? 'Loading...' : `${filtered.length} note${filtered.length !== 1 ? 's' : ''} · ${notes.length} total`}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white
            transition-all hover:opacity-90 active:scale-95 self-start sm:self-auto cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
        >
          <PlusIcon size={14} />
          New Note
        </button>
      </div>

      {/* ── Stats row ──────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Notes', value: notes.length, icon: <StickyNoteIcon size={14} className="text-violet-400" />, bg: 'rgba(139,92,246,0.1)' },
          { label: 'Topics covered', value: new Set(notes.map((n) => n.topicId)).size, icon: <BookOpenIcon size={14} className="text-blue-400" />, bg: 'rgba(59,130,246,0.1)' },
          { label: 'This week', value: notes.filter((n) => Date.now() - new Date(n.createdAt).getTime() < 7 * 86400000).length, icon: <StickyNoteIcon size={14} className="text-emerald-400" />, bg: 'rgba(52,211,153,0.1)' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 flex items-center gap-3"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: s.bg }}>
              {s.icon}
            </div>
            <div>
              <p className="text-base font-bold text-slate-100 tabular-nums leading-none">{loading ? '-' : s.value}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Controls ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <SearchIcon size={15} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-slate-300 placeholder:text-slate-600"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-600 hover:text-slate-400 text-xs">✕</button>
          )}
        </div>

        {/* Topic selector */}
        <select
          value={topicId}
          onChange={(e) => setTopicId(Number(e.target.value))}
          className="px-3 py-2.5 rounded-xl text-sm text-slate-300 outline-none cursor-pointer"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <option value={0}>All Topics</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>{t.title}</option>
          ))}
        </select>
      </div>

      {/* ── Notes list grouped by date ─────────────────── */}
      {loading ? (
        <div className="space-y-8 animate-pulse">
          <div className="h-6 w-32 bg-white/[0.03] rounded-lg" />
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-white/[0.03] border border-white/[0.05]" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-red-500/10 border border-red-500/20">
            <span className="text-red-400 text-lg font-bold">!</span>
          </div>
          <p className="text-sm font-medium text-slate-400">Failed to load notes</p>
          <p className="text-xs text-slate-600 mt-1">{error}</p>
        </div>
      ) : Object.keys(grouped).length > 0 ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([date, notesList]) => (
            <section key={date}>
              {/* Date heading */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{date}</span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-[11px] text-slate-600">{notesList.length} note{notesList.length !== 1 ? 's' : ''}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {notesList.map((note, i) => (
                  <div key={note.id} className="fade-in-up" style={{ animationDelay: `${i * 0.05}s`, opacity: 1 }}>
                    <NoteCard 
                      note={note} 
                      onDelete={() => handleDeleteNote(note.id)}
                      onToggleImportant={() => handleToggleNoteImportance(note.id, note.isImportant || false)}
                    />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
            <StickyNoteIcon size={20} className="text-slate-600" />
          </div>
          <p className="text-sm font-medium text-slate-400">No notes found</p>
          <p className="text-xs text-slate-600 mt-1">Try a different search term or topic filter</p>
        </div>
      )}

      {/* ── Add Note Modal ─────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div 
            className="w-full max-w-lg rounded-2xl p-6 space-y-4 animate-scale-in"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-base font-bold text-slate-100">Add New Note</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-500 hover:text-slate-300 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            {submitError && (
              <div className="p-3 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                {submitError}
              </div>
            )}

            <form onSubmit={handleAddNote} className="space-y-4">
              {/* Topic Select */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Select Topic *</label>
                {topics.length > 0 ? (
                  <select
                    value={newTopicId}
                    onChange={(e) => setNewTopicId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl text-sm text-slate-200 bg-[#0e0e11] border border-white/[0.08] outline-none cursor-pointer focus:border-violet-500/50"
                  >
                    {topics.map((t) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-xs text-red-400">No topics exist. Create a topic first before adding notes.</p>
                )}
              </div>

              {/* Note Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Note Content *</label>
                <textarea 
                  placeholder="Capture key concepts, code snippets, or takeaways..."
                  required
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl text-sm text-slate-200 bg-white/[0.03] border border-white/[0.08] outline-none focus:border-violet-500/50 transition-colors resize-none"
                />
              </div>

              {/* Importance Switch */}
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox"
                  id="isImportant"
                  checked={isImportant}
                  onChange={(e) => setIsImportant(e.target.checked)}
                  className="w-4 h-4 rounded border-white/[0.08] bg-white/[0.03] text-violet-600 focus:ring-violet-500/50 accent-violet-600 cursor-pointer"
                />
                <label htmlFor="isImportant" className="text-xs font-semibold text-slate-400 cursor-pointer select-none">
                  Mark as important (Save as revision card)
                </label>
              </div>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || topics.length === 0}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-opacity active:scale-95 cursor-pointer disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                >
                  {isSubmitting ? 'Adding...' : 'Add Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
