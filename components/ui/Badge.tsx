import type { TopicStatus } from '@/types';

interface BadgeProps {
  status: TopicStatus;
  className?: string;
}

const config: Record<'not_started' | 'in_progress' | 'completed', { label: string; dot: string; text: string; bg: string; border: string }> = {
  not_started: {
    label: 'Not Started',
    dot:    'bg-slate-500',
    text:   'text-slate-400',
    bg:     'rgba(100,116,139,0.1)',
    border: 'rgba(100,116,139,0.2)',
  },
  in_progress: {
    label: 'In Progress',
    dot:    'bg-blue-400',
    text:   'text-blue-400',
    bg:     'rgba(59,130,246,0.1)',
    border: 'rgba(59,130,246,0.2)',
  },
  completed: {
    label: 'Completed',
    dot:    'bg-emerald-400',
    text:   'text-emerald-400',
    bg:     'rgba(52,211,153,0.1)',
    border: 'rgba(52,211,153,0.2)',
  },
};

export default function Badge({ status, className = '' }: BadgeProps) {
  const normStatus = (status ? status.toLowerCase() : 'not_started') as 'not_started' | 'in_progress' | 'completed';
  const { label, dot, text, bg, border } = config[normStatus] || config['not_started'];
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ${text} ${className}`}
      style={{ background: bg, border: `1px solid ${border}` }}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
      {label}
    </span>
  );
}
