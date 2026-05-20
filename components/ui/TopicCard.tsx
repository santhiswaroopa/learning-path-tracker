import type { Topic } from '@/types';
import Badge from './Badge';
import ProgressBar from './ProgressBar';

interface TopicCardProps {
  topic: Topic;
  onClick?: () => void;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  Programming:  { bg: 'rgba(139,92,246,0.12)',  text: '#a78bfa' },
  Architecture: { bg: 'rgba(99,102,241,0.12)',  text: '#818cf8' },
  Frontend:     { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa' },
  Databases:    { bg: 'rgba(20,184,166,0.12)',  text: '#2dd4bf' },
  DevOps:       { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24' },
  Backend:      { bg: 'rgba(236,72,153,0.12)',  text: '#f472b6' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function TopicCard({ topic, onClick }: TopicCardProps) {
  const done  = topic.subtopics.filter((s) => s.isCompleted || (s as any).isDone).length;
  const total = topic.subtopics.length;
  const cat   = categoryColors[topic.category] ?? { bg: 'rgba(255,255,255,0.06)', text: '#94a3b8' };

  return (
    <article
      onClick={onClick}
      className="card-hover rounded-xl p-5 flex flex-col gap-4 cursor-pointer active:scale-[0.99] transition-all"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Category chip */}
          <span
            className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2 uppercase tracking-wider"
            style={{ background: cat.bg, color: cat.text }}
          >
            {topic.category}
          </span>

          <h3 className="text-sm font-semibold text-slate-100 leading-snug line-clamp-2">
            {topic.title}
          </h3>
        </div>

        <Badge status={topic.status} className="shrink-0 mt-0.5" />
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 -mt-1">
        {topic.description}
      </p>

      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-slate-500">Progress</span>
          <span className="text-xs font-semibold text-slate-300 tabular-nums">{topic.progress}%</span>
        </div>
        <ProgressBar value={topic.progress} height={5} />
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-1.5">
          {/* Subtopic pills */}
          <span className="text-[11px] text-slate-500">
            <span className="text-slate-300 font-medium">{done}</span>/{total} subtopics
          </span>
        </div>
        <span className="text-[11px] text-slate-600">{formatDate(topic.createdAt)}</span>
      </div>
    </article>
  );
}
