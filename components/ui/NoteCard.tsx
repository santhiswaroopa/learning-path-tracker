import type { Note } from '@/types';
import { StickyNoteIcon } from '@/components/icons';

interface NoteCardProps {
  note: Note;
  onDelete?: () => void;
  onToggleImportant?: () => void;
}

const StarIcon = ({ size = 13, className = '', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const TrashIcon = ({ size = 13, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Derive a short title from the first sentence / words
function excerptTitle(content: string, max = 60): string {
  const first = content.split(/[.\n]/)[0].trim();
  return first.length > max ? first.slice(0, max) + '…' : first;
}

export default function NoteCard({ note, onDelete, onToggleImportant }: NoteCardProps) {
  const isImp = !!note.isImportant;
  return (
    <article
      className={`card-hover rounded-xl p-5 flex flex-col gap-3 min-h-[170px] transition-all duration-300 ${
        isImp ? 'shadow-[0_0_20px_rgba(139,92,246,0.12)] border-violet-500/30' : ''
      }`}
      style={{
        background: isImp 
          ? 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, var(--card) 100%)' 
          : 'var(--card)',
        border: isImp 
          ? '1px solid rgba(139,92,246,0.3)' 
          : '1px solid var(--border)'
      }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.2)' }}
        >
          <StickyNoteIcon size={14} className="text-violet-400" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-slate-200 leading-snug line-clamp-2">
            {excerptTitle(note.content)}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            {/* Topic badge */}
            <span
              className="text-[10px] px-2 py-0.5 rounded-full text-violet-400 font-medium truncate max-w-[150px]"
              style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}
              title={note.topic.title}
            >
              {note.topic.title}
            </span>
          </div>
        </div>
      </div>

      {/* Content preview */}
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 flex-1">
        {note.content}
      </p>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-2 mt-auto"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <time className="text-[11px] text-slate-600" title={formatDate(note.createdAt)}>
          {timeAgo(note.createdAt)}
        </time>

        <div className="flex items-center gap-2.5">
          {onToggleImportant && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleImportant();
              }}
              className="text-slate-500 hover:text-yellow-400 transition-colors cursor-pointer p-1 -m-1"
              title={note.isImportant ? 'Mark unimportant' : 'Mark important'}
            >
              <StarIcon size={13} fill={note.isImportant ? 'currentColor' : 'none'} className={note.isImportant ? 'text-yellow-400' : 'text-slate-500'} />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer p-1 -m-1"
              title="Delete note"
            >
              <TrashIcon size={13} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
