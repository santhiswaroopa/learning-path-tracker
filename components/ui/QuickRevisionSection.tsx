'use client';

import { useState, useEffect } from 'react';
import type { Note } from '@/types';
import QuickRevisionCard from './QuickRevisionCard';

interface QuickRevisionSectionProps {
  notes: Note[];
  onToggleImportant: (noteId: number, currentVal: boolean) => Promise<void>;
}

export default function QuickRevisionSection({
  notes,
  onToggleImportant,
}: QuickRevisionSectionProps) {
  const [filter, setFilter] = useState<'all' | 'recent' | 'revised'>('all');
  const [revisionCounts, setRevisionCounts] = useState<Record<number, number>>({});
  const [activeRevisionNote, setActiveRevisionNote] = useState<Note | null>(null);

  // Load revision counts from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lpt_revision_counts');
      if (stored) {
        setRevisionCounts(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load revision counts:', e);
    }
  }, []);

  // Filter and sort the important notes
  const importantNotes = notes.filter((n) => !!n.isImportant);

  const getSortedNotes = () => {
    const list = [...importantNotes];
    if (filter === 'recent') {
      // Sort by creation date descending
      return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    if (filter === 'revised') {
      // Sort by revision count descending
      return list.sort((a, b) => {
        const countA = revisionCounts[a.id] || 0;
        const countB = revisionCounts[b.id] || 0;
        if (countB !== countA) return countB - countA;
        // fallback to date
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
    }
    // 'all' - default list (usually descending by creation date from api)
    return list;
  };

  const sortedNotes = getSortedNotes();

  const handleRevise = (note: Note) => {
    // Increment revision count
    const updatedCounts = {
      ...revisionCounts,
      [note.id]: (revisionCounts[note.id] || 0) + 1,
    };
    setRevisionCounts(updatedCounts);
    try {
      localStorage.setItem('lpt_revision_counts', JSON.stringify(updatedCounts));
    } catch (e) {
      console.error('Failed to save revision counts:', e);
    }
    // Open the note in details modal
    setActiveRevisionNote(note);
  };

  return (
    <section className="space-y-4">
      {/* Section Header & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span className="text-yellow-400">⭐</span> Quick Revision
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Revise key concepts you marked as important
          </p>
        </div>

        {/* Filters */}
        <div 
          className="flex p-0.5 rounded-lg text-xs"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
        >
          {(
            [
              { key: 'all', label: 'All Important' },
              { key: 'recent', label: 'Recently Added' },
              { key: 'revised', label: 'Most Revised' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key)}
              className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
                filter === opt.key
                  ? 'bg-violet-600/20 text-violet-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid or Empty State */}
      {importantNotes.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center p-8 text-center rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(139,92,246,0.02) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px dashed rgba(139,92,246,0.2)',
          }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mb-3 text-lg"
            style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}
          >
            ⭐
          </div>
          <p className="text-xs font-medium text-slate-400 max-w-sm">
            Mark important notes while learning to build your quick revision library.
          </p>
        </div>
      ) : sortedNotes.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-500">
          No notes match the current filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedNotes.map((note) => (
            <QuickRevisionCard
              key={note.id}
              note={note}
              revisionCount={revisionCounts[note.id] || 0}
              onToggleImportant={() => onToggleImportant(note.id, true)}
              onRevise={() => handleRevise(note)}
            />
          ))}
        </div>
      )}

      {/* Quick Revision Viewer Modal */}
      {activeRevisionNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div
            className="w-full max-w-lg rounded-2xl p-6 space-y-4 animate-scale-in relative overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, rgba(20, 20, 25, 0.95) 0%, rgba(10, 10, 12, 0.98) 100%)',
              border: '1px solid rgba(139,92,246,0.3)',
              boxShadow: '0 20px 50px rgba(139,92,246,0.15), 0 0 0 1px rgba(139,92,246,0.15)',
            }}
          >
            {/* Top glowing line */}
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500" />

            <div className="flex items-start justify-between gap-3 pb-3 border-b border-white/[0.06]">
              <div className="flex flex-col gap-1">
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full text-violet-400 font-semibold self-start"
                  style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}
                >
                  {activeRevisionNote.topic.title}
                </span>
                <span className="text-[10px] text-slate-500">
                  Created on {new Date(activeRevisionNote.createdAt).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <button
                onClick={() => setActiveRevisionNote(null)}
                className="text-slate-500 hover:text-slate-300 text-sm cursor-pointer p-1"
              >
                ✕
              </button>
            </div>

            {/* Note Content Display */}
            <div className="py-2">
              <div
                className="rounded-xl p-4 text-sm text-slate-200 leading-relaxed font-sans whitespace-pre-wrap select-text max-h-[300px] overflow-y-auto"
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.04)',
                }}
              >
                {activeRevisionNote.content}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-white/[0.06]">
              <span className="text-[10px] text-violet-400 font-medium flex items-center gap-1">
                ⚡ Revised {(revisionCounts[activeRevisionNote.id] || 0)} times
              </span>
              <button
                onClick={() => setActiveRevisionNote(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 cursor-pointer active:scale-95 shadow-[0_2px_8px_rgba(139,92,246,0.2)]"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
