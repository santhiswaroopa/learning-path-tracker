import type { Note } from '@/types';

interface QuickRevisionCardProps {
  note: Note;
  onToggleImportant: () => void;
  onRevise: () => void;
  revisionCount: number;
}

const StarIcon = ({ size = 13, className = '', fill = 'none' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const BookOpenIcon = ({ size = 12, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
  </svg>
);

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function QuickRevisionCard({
  note,
  onToggleImportant,
  onRevise,
  revisionCount,
}: QuickRevisionCardProps) {
  return (
    <article
      className="group relative rounded-xl p-4 flex flex-col gap-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgb(139,92,246,0.15)] overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(139,92,246,0.06) 0%, rgba(99,102,241,0.03) 100%)',
        border: '1px solid rgba(139,92,246,0.25)',
      }}
    >
      {/* Decorative top gradient border glow on hover */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-violet-500 via-indigo-500 to-blue-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        {/* Topic Badge */}
        <span
          className="text-[10px] px-2.5 py-0.5 rounded-full text-violet-400 font-semibold truncate max-w-[150px] shrink-0"
          style={{ background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)' }}
          title={note.topic.title}
        >
          {note.topic.title}
        </span>

        {/* ⭐ Important Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleImportant();
          }}
          className="text-yellow-400 hover:scale-110 active:scale-95 transition-all p-1 -m-1 cursor-pointer relative"
          title="Remove from revision library"
        >
          <StarIcon size={14} fill="currentColor" className="drop-shadow-[0_0_4px_rgba(250,204,21,0.6)]" />
        </button>
      </div>

      {/* Content Preview */}
      <p className="text-xs text-slate-300 leading-relaxed line-clamp-3 select-none flex-1">
        {note.content}
      </p>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-2.5 mt-auto"
        style={{ borderTop: '1px solid rgba(139,92,246,0.15)' }}
      >
        <div className="flex flex-col">
          <time className="text-[10px] text-slate-500" title={formatDate(note.createdAt)}>
            {timeAgo(note.createdAt)}
          </time>
          {revisionCount > 0 && (
            <span className="text-[9px] text-violet-400/80 font-medium mt-0.5">
              Revised {revisionCount}x
            </span>
          )}
        </div>

        {/* Quick Revision Button */}
        <button
          onClick={onRevise}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-white transition-all bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 active:scale-95 shadow-[0_2px_8px_rgba(139,92,246,0.2)] hover:shadow-[0_4px_12px_rgba(139,92,246,0.35)] cursor-pointer"
        >
          <BookOpenIcon size={10} />
          Revise
        </button>
      </div>
    </article>
  );
}
