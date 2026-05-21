'use client';

import { useState, useEffect } from 'react';
import TopicCard from '@/components/ui/TopicCard';
import Badge from '@/components/ui/Badge';
import ProgressBar from '@/components/ui/ProgressBar';
import { SearchIcon, FilterIcon, PlusIcon, FileTextIcon, CheckCircleIcon, LayersIcon } from '@/components/icons';
import type { Topic, TopicStatus, Subtopic, Note } from '@/types';

// Helper: always send session cookie with API calls
const apiFetch = (url: string, options: RequestInit = {}) =>
  fetch(url, { ...options, credentials: 'include' });

const FILTERS: { label: string; value: 'all' | TopicStatus }[] = [
  { label: 'All',          value: 'all' },
  { label: 'In Progress',  value: 'IN_PROGRESS' },
  { label: 'Not Started',  value: 'NOT_STARTED' },
  { label: 'Completed',    value: 'COMPLETED' },
];

const CATEGORIES = ['All', 'Programming', 'Architecture', 'Frontend', 'Databases', 'DevOps', 'Backend'];

// Inline SVG Icons
const TrashIcon = ({ size = 15, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const StarIcon = ({ size = 15, className = '', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

export default function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState<'all' | TopicStatus>('all');
  const [category, setCategory] = useState('All');

  // Modal State (Add Topic)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Programming');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');
  const [newSubtopicsText, setNewSubtopicsText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Drawer State (Topic Details)
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
  const [drawerNotes, setDrawerNotes] = useState<Note[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [noteContent, setNoteContent] = useState('');
  const [noteIsImportant, setNoteIsImportant] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Add-step inline state
  const [isAddingStep, setIsAddingStep] = useState(false);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [isSubmittingStep, setIsSubmittingStep] = useState(false);

  // Fetch Topics
  const fetchTopics = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const res = await apiFetch('/api/topics');
      if (!res.ok) throw new Error('Failed to fetch topics');
      const data = await res.json();
      setTopics(data);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Something went wrong');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics();
  }, []);

  // Fetch Notes for Selected Topic when drawer opens
  useEffect(() => {
    if (!selectedTopic) {
      setDrawerNotes([]);
      setConfirmDelete(false);
      setIsAddingStep(false);
      setNewStepTitle('');
      return;
    }

    const topicId = selectedTopic.id;

    async function fetchNotesForTopic() {
      try {
        setLoadingNotes(true);
        const res = await apiFetch(`/api/notes?topicId=${topicId}`);
        if (!res.ok) throw new Error('Failed to load notes');
        const data = await res.json();
        setDrawerNotes(data);
      } catch (err) {
        console.error('Error fetching notes:', err);
      } finally {
        setLoadingNotes(false);
      }
    }

    fetchNotesForTopic();
  }, [selectedTopic]);

  // Filter Logic
  const filtered = topics.filter((t) => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase());
    
    const matchStatus = status === 'all' || 
      t.status.toUpperCase() === status.toUpperCase();

    const matchCat = category === 'All' || t.category === category;
    return matchSearch && matchStatus && matchCat;
  });

  const getCountByStatus = (val: 'all' | TopicStatus) => {
    if (val === 'all') return topics.length;
    return topics.filter((t) => t.status.toUpperCase() === val.toUpperCase()).length;
  };

  // Add Topic Submit
  const handleAddTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setSubmitError('Title is required');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);

      const subtopicsList = newSubtopicsText
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      const res = await apiFetch('/api/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          category: newCategory,
          description: newDescription,
          priority: newPriority,
          subtopics: subtopicsList,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create topic');
      }

      const createdTopic = await res.json();
      setTopics((prev) => [createdTopic, ...prev]);

      // Reset
      setNewTitle('');
      setNewDescription('');
      setNewSubtopicsText('');
      setNewPriority('MEDIUM');
      setNewCategory('Programming');
      setIsModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setSubmitError(err.message || 'Failed to add topic');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Subtopic Completion (Optimistic UI updates)
  const handleToggleSubtopic = async (subtopicId: number) => {
    if (!selectedTopic) return;

    const targetSub = selectedTopic.subtopics.find((s) => s.id === subtopicId);
    if (!targetSub) return;
    const nextCompleted = !targetSub.isCompleted;

    // 1. Optimistically calculate new values
    const updatedSubtopics = selectedTopic.subtopics.map((s) => 
      s.id === subtopicId ? { ...s, isCompleted: nextCompleted } : s
    );
    const completedCount = updatedSubtopics.filter((s) => s.isCompleted).length;
    const totalCount = updatedSubtopics.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    let newStatus = selectedTopic.status;
    if (progress === 100) newStatus = 'COMPLETED';
    else if (progress > 0) newStatus = 'IN_PROGRESS';
    else newStatus = 'NOT_STARTED';

    const updatedTopic = {
      ...selectedTopic,
      subtopics: updatedSubtopics,
      progress,
      status: newStatus,
    };

    // 2. Apply updates immediately to local lists
    setSelectedTopic(updatedTopic);
    setTopics((prev) => prev.map((t) => (t.id === selectedTopic.id ? updatedTopic : t)));

    // 3. Make API call in background
    try {
      const res = await apiFetch(`/api/subtopics/${subtopicId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isCompleted: nextCompleted }),
      });
      if (!res.ok) throw new Error('Failed to update subtopic');
    } catch (err) {
      console.error(err);
      // Revert if failed
      fetchTopics(false);
    }
  };

  // Toggle Topic Completion
  const handleToggleTopicCompleted = async () => {
    if (!selectedTopic) return;

    const isAlreadyCompleted = selectedTopic.status.toUpperCase() === 'COMPLETED';
    const nextStatus = isAlreadyCompleted ? 'IN_PROGRESS' : 'COMPLETED';
    const nextProgress = isAlreadyCompleted ? 50 : 100;

    // Optimistic update
    const updatedSubtopics = selectedTopic.subtopics.map((s) => ({
      ...s,
      isCompleted: nextStatus === 'COMPLETED',
    }));

    const updatedTopic = {
      ...selectedTopic,
      status: nextStatus as TopicStatus,
      progress: nextProgress,
      subtopics: updatedSubtopics,
    };

    setSelectedTopic(updatedTopic);
    setTopics((prev) => prev.map((t) => (t.id === selectedTopic.id ? updatedTopic : t)));

    try {
      const res = await apiFetch(`/api/topics/${selectedTopic.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: nextStatus,
          progress: nextProgress,
        }),
      });
      if (!res.ok) throw new Error('Failed to update topic status');
      
      // Sync list
      fetchTopics(false);
    } catch (err) {
      console.error(err);
      fetchTopics(false);
    }
  };

  // Delete Topic
  const handleDeleteTopic = async () => {
    if (!selectedTopic) return;

    try {
      const res = await apiFetch(`/api/topics/${selectedTopic.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete topic');

      setTopics((prev) => prev.filter((t) => t.id !== selectedTopic.id));
      setSelectedTopic(null);
    } catch (err) {
      console.error(err);
      alert('Failed to delete topic');
    }
  };

  // Add Note inline in drawer
  const handleAddNoteToTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic || !noteContent.trim()) return;

    try {
      setIsSubmittingNote(true);
      const res = await apiFetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topicId: selectedTopic.id,
          content: noteContent,
          isImportant: noteIsImportant,
        }),
      });

      if (!res.ok) throw new Error('Failed to add note');

      const createdNote = await res.json();
      setDrawerNotes((prev) => [createdNote, ...prev]);
      setNoteContent('');
      setNoteIsImportant(false);
    } catch (err) {
      console.error(err);
      alert('Failed to add note');
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // Toggle Note Importance
  const handleToggleNoteImportance = async (noteId: number, currentVal: boolean) => {
    // Optimistic Update
    setDrawerNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, isImportant: !currentVal } : n));

    try {
      const res = await apiFetch(`/api/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isImportant: !currentVal }),
      });
      if (!res.ok) throw new Error('Failed to toggle note importance');
    } catch (err) {
      console.error(err);
      // Revert
      setDrawerNotes((prev) => prev.map((n) => n.id === noteId ? { ...n, isImportant: currentVal } : n));
    }
  };

  // Delete Note
  const handleDeleteNote = async (noteId: number) => {
    // Optimistic Update
    setDrawerNotes((prev) => prev.filter((n) => n.id !== noteId));

    try {
      const res = await apiFetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete note');
    } catch (err) {
      console.error(err);
      // Re-fetch notes if error
      if (selectedTopic) {
        const res = await apiFetch(`/api/notes?topicId=${selectedTopic.id}`);
        if (res.ok) setDrawerNotes(await res.json());
      }
    }
  };

  // Add a new learning step to an already-created topic
  const handleAddStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic || !newStepTitle.trim()) return;

    try {
      setIsSubmittingStep(true);
      const res = await apiFetch('/api/subtopics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId: selectedTopic.id, title: newStepTitle.trim() }),
      });
      if (!res.ok) throw new Error('Failed to add step');
      const { subtopic, topicProgress } = await res.json();

      // Optimistically update local state
      const updatedTopic = {
        ...selectedTopic,
        subtopics: [...selectedTopic.subtopics, subtopic],
        progress: topicProgress,
      };
      setSelectedTopic(updatedTopic);
      setTopics((prev) => prev.map((t) => (t.id === selectedTopic.id ? updatedTopic : t)));
      setNewStepTitle('');
      setIsAddingStep(false);
    } catch (err) {
      console.error(err);
      alert('Failed to add step. Please try again.');
    } finally {
      setIsSubmittingStep(false);
    }
  };

  return (
    <div className="space-y-6 max-w-[1400px] w-full min-w-0">
      {/* ── Header bar ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100">Learning Topics</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {loading ? 'Loading...' : `${filtered.length} topic${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white
            transition-all hover:opacity-90 active:scale-95 self-start sm:self-auto cursor-pointer"
          style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
        >
          <PlusIcon size={14} />
          Add Topic
        </button>
      </div>

      {/* ── Search + filter row ─────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 px-3 py-2.5 rounded-xl text-sm"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <SearchIcon size={15} className="text-slate-500 shrink-0" />
          <input
            type="text"
            placeholder="Search topics…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent outline-none text-sm text-slate-300 placeholder:text-slate-600"
          />
          {search && (
            <button onClick={() => setSearch('')} className="text-slate-600 hover:text-slate-400 text-xs">✕</button>
          )}
        </div>

        {/* Category filter */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl overflow-x-auto w-full min-w-0"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <FilterIcon size={13} className="text-slate-500 ml-1.5 shrink-0" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer"
              style={
                category === cat
                  ? { background: 'linear-gradient(135deg, #8b5cf6, #6366f1)', color: 'white' }
                  : { color: '#64748b' }
              }
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* ── Status tabs ─────────────────────────────────── */}
      <div className="flex items-center gap-1 p-1 rounded-xl w-full overflow-x-auto"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatus(f.value)}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0"
            style={
              status === f.value
                ? { background: 'var(--elevated)', color: '#e2e8f0', border: '1px solid var(--border-hover)' }
                : { color: '#64748b' }
            }
          >
            {f.label}
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full tabular-nums font-semibold"
              style={{
                background: status === f.value ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.05)',
                color: status === f.value ? '#c4b5fd' : '#475569',
              }}
            >
              {getCountByStatus(f.value)}
            </span>
          </button>
        ))}
      </div>

      {/* ── Topic grid ─────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-white/[0.03] border border-white/[0.05] animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-red-500/10 border border-red-500/20">
            <span className="text-red-400 text-lg font-bold">!</span>
          </div>
          <p className="text-sm font-medium text-slate-400">Failed to load topics</p>
          <p className="text-xs text-slate-600 mt-1">{error}</p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((topic, i) => (
            <div key={topic.id} className="fade-in-up" style={{ animationDelay: `${i * 0.04}s`, opacity: 1 }}>
              <TopicCard topic={topic} onClick={() => setSelectedTopic(topic)} />
            </div>
          ))}
        </div>
      ) : topics.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
            <LayersIcon size={20} className="text-slate-600" />
          </div>
          <p className="text-sm font-medium text-slate-400">No topics created yet</p>
          <p className="text-xs text-slate-600 mt-1">Get started by clicking the &quot;New Topic&quot; button above.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
            <SearchIcon size={20} className="text-slate-600" />
          </div>
          <p className="text-sm font-medium text-slate-400">No topics found</p>
          <p className="text-xs text-slate-600 mt-1">Try adjusting your search or filters</p>
        </div>
      )}

      {/* ── Add Topic Modal ─────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div 
            className="w-full max-w-lg rounded-2xl p-6 space-y-4 animate-scale-in"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h3 className="text-base font-bold text-slate-100">Add New Topic</h3>
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

            <form onSubmit={handleAddTopic} className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Topic Title *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Docker Fundamentals"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm text-slate-200 bg-[#0e0e11] border border-white/[0.08] outline-none focus:border-violet-500/50 transition-colors"
                />
              </div>

              {/* Grid: Category & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm text-slate-200 bg-[#0e0e11] border border-white/[0.08] outline-none cursor-pointer focus:border-violet-500/50"
                  >
                    {CATEGORIES.slice(1).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-400">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-sm text-slate-200 bg-[#0e0e11] border border-white/[0.08] outline-none cursor-pointer focus:border-violet-500/50"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Description</label>
                <textarea 
                  placeholder="What is this learning path about?"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl text-sm text-slate-200 bg-[#0e0e11] border border-white/[0.08] outline-none focus:border-violet-500/50 transition-colors resize-none"
                />
              </div>

              {/* Subtopics */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">Subtopics (Comma-separated)</label>
                <input 
                  type="text"
                  placeholder="e.g. Containers, Volumes, Networking"
                  value={newSubtopicsText}
                  onChange={(e) => setNewSubtopicsText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-sm text-slate-200 bg-[#0e0e11] border border-white/[0.08] outline-none focus:border-violet-500/50 transition-colors"
                />
                <p className="text-[10px] text-slate-500">Each subtopic will be added as an uncompleted learning step.</p>
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
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-opacity active:scale-95 cursor-pointer disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #6366f1)' }}
                >
                  {isSubmitting ? 'Creating...' : 'Create Topic'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Topic Details Slide-over Drawer ──────────────── */}
      {selectedTopic && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          {/* Backdrop Click */}
          <div className="absolute inset-0" onClick={() => setSelectedTopic(null)} />

          {/* Drawer Panel */}
          <div 
            className="relative w-full max-w-lg h-full flex flex-col shadow-2xl animate-slide-in-right overflow-hidden"
            style={{ background: 'var(--elevated)', borderLeft: '1px solid var(--border)' }}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest px-2 py-0.5 rounded bg-violet-400/10 border border-violet-400/20">
                  {selectedTopic.category}
                </span>
                <h3 className="text-base font-bold text-slate-100 mt-2">{selectedTopic.title}</h3>
              </div>
              <button 
                onClick={() => setSelectedTopic(null)}
                className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.03] hover:bg-white/[0.08] text-slate-400 hover:text-slate-200 transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Description & Priority */}
              <div className="space-y-3">
                <p className="text-xs text-slate-400 leading-relaxed">{selectedTopic.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-white/[0.04]">
                  <span>Priority: <strong className="text-slate-300">{selectedTopic.priority || 'MEDIUM'}</strong></span>
                  <span>Created: <strong className="text-slate-300">{new Date(selectedTopic.createdAt).toLocaleDateString()}</strong></span>
                </div>
              </div>

              {/* Progress & Quick Actions */}
              <div className="p-4 rounded-xl space-y-4" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">Overall Progress</span>
                  <span className="text-xs font-bold text-violet-400">{selectedTopic.progress}%</span>
                </div>
                <ProgressBar value={selectedTopic.progress} height={6} />
                
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={handleToggleTopicCompleted}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    style={{
                      background: selectedTopic.status.toUpperCase() === 'COMPLETED'
                        ? 'rgba(16,185,129,0.1)'
                        : 'rgba(255,255,255,0.03)',
                      color: selectedTopic.status.toUpperCase() === 'COMPLETED' ? '#34d399' : '#94a3b8',
                      border: selectedTopic.status.toUpperCase() === 'COMPLETED'
                        ? '1px solid rgba(16,185,129,0.2)'
                        : '1px solid var(--border)',
                    }}
                  >
                    <CheckCircleIcon size={12} />
                    {selectedTopic.status.toUpperCase() === 'COMPLETED' ? 'Completed' : 'Mark Completed'}
                  </button>

                  {confirmDelete ? (
                    <div className="flex gap-1.5 flex-1">
                      <button
                        onClick={handleDeleteTopic}
                        className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold cursor-pointer"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        className="px-3 bg-white/[0.03] text-slate-400 rounded-lg text-xs font-bold hover:text-slate-200 cursor-pointer"
                        style={{ border: '1px solid var(--border)' }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="px-3 inline-flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold border border-red-500/20 transition-colors cursor-pointer"
                    >
                      <TrashIcon size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* Subtopics Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Learning Steps</h4>
                  {!isAddingStep && (
                    <button
                      onClick={() => { setIsAddingStep(true); setNewStepTitle(''); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-violet-400 hover:text-violet-300 transition-all cursor-pointer"
                      style={{ background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}
                    >
                      <PlusIcon size={10} />
                      Add More
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {selectedTopic.subtopics.map((sub: Subtopic) => (
                    <label 
                      key={sub.id}
                      className="flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all hover:bg-white/[0.02]"
                      style={{ border: '1px solid var(--border)' }}
                    >
                      <input 
                        type="checkbox"
                        checked={sub.isCompleted || (sub as any).isDone || false}
                        onChange={() => handleToggleSubtopic(sub.id)}
                        className="w-4 h-4 rounded bg-white/[0.03] border-white/[0.08] text-violet-600 focus:ring-violet-500/50 accent-violet-600 cursor-pointer"
                      />
                      <span className={`text-xs font-medium transition-colors ${sub.isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'}`}>
                        {sub.title}
                      </span>
                    </label>
                  ))}
                  {selectedTopic.subtopics.length === 0 && !isAddingStep && (
                    <p className="text-xs text-slate-500 text-center py-4">No learning steps yet. Add your first step above.</p>
                  )}
                  {/* Inline Add-Step Form */}
                  {isAddingStep && (
                    <form
                      onSubmit={handleAddStep}
                      className="flex items-center gap-2 p-2.5 rounded-lg"
                      style={{ border: '1px dashed rgba(139,92,246,0.45)', background: 'rgba(139,92,246,0.05)' }}
                    >
                      <input
                        autoFocus
                        type="text"
                        placeholder="e.g. Advanced Queries"
                        value={newStepTitle}
                        onChange={(e) => setNewStepTitle(e.target.value)}
                        className="flex-1 bg-transparent outline-none text-xs text-slate-200 placeholder:text-slate-600"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingStep || !newStepTitle.trim()}
                        className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-semibold disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                      >
                        {isSubmittingStep ? '...' : 'Add'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsAddingStep(false)}
                        className="text-slate-500 hover:text-slate-300 text-xs cursor-pointer shrink-0"
                      >
                        ✕
                      </button>
                    </form>
                  )}
                </div>
              </div>

              {/* Notes Section */}
              <div className="space-y-4 pt-4 border-t border-white/[0.04]">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <FileTextIcon size={13} className="text-slate-400" />
                  Notes & Key Concepts
                </h4>

                {/* Inline Add Note Form */}
                <form onSubmit={handleAddNoteToTopic} className="space-y-3 p-3 rounded-xl" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
                  <textarea
                    placeholder="Add a new thought or code snippet..."
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    required
                    rows={2}
                    className="w-full bg-transparent outline-none text-xs text-slate-200 placeholder:text-slate-600 resize-none"
                  />
                  <div className="flex items-center justify-between pt-2 border-t border-white/[0.04]">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-500 select-none">
                      <input 
                        type="checkbox"
                        checked={noteIsImportant}
                        onChange={(e) => setNoteIsImportant(e.target.checked)}
                        className="w-3.5 h-3.5 rounded bg-white/[0.03] border-white/[0.08] text-violet-600 focus:ring-violet-500/50 accent-violet-600 cursor-pointer"
                      />
                      Save to revision cards
                    </label>
                    <button
                      type="submit"
                      disabled={isSubmittingNote || !noteContent.trim()}
                      className="px-2.5 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white text-[10px] font-semibold disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {isSubmittingNote ? 'Saving...' : 'Add Note'}
                    </button>
                  </div>
                </form>

                {/* Notes List */}
                <div className="space-y-3">
                  {loadingNotes ? (
                    <p className="text-xs text-slate-500 text-center py-4">Loading notes...</p>
                  ) : drawerNotes.length > 0 ? (
                    drawerNotes.map((n) => (
                      <div 
                        key={n.id}
                        className={`p-3.5 rounded-xl flex flex-col gap-2 relative group transition-all duration-300 ${
                          n.isImportant ? 'shadow-[0_0_15px_rgba(139,92,246,0.1)] border-violet-500/20' : ''
                        }`}
                        style={{
                          background: n.isImportant 
                            ? 'linear-gradient(135deg, rgba(139,92,246,0.05) 0%, var(--card) 100%)' 
                            : 'var(--card)',
                          border: n.isImportant 
                            ? '1px solid rgba(139,92,246,0.25)' 
                            : '1px solid var(--border)'
                        }}
                      >
                        <p className="text-xs text-slate-300 leading-relaxed">{n.content}</p>
                        
                        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-white/[0.03]">
                          <span>{new Date(n.createdAt).toLocaleDateString()}</span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleToggleNoteImportance(n.id, n.isImportant || false)}
                              className="text-slate-500 hover:text-yellow-400 transition-colors cursor-pointer"
                              title={n.isImportant ? 'Mark unimportant' : 'Mark important'}
                            >
                              <StarIcon size={12} fill={n.isImportant ? 'currentColor' : 'none'} className={n.isImportant ? 'text-yellow-400' : 'text-slate-500'} />
                            </button>
                            <button
                              onClick={() => handleDeleteNote(n.id)}
                              className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                              title="Delete note"
                            >
                              <TrashIcon size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500 text-center py-4">No notes saved for this topic yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
