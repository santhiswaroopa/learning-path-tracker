interface ProgressBarProps {
  value: number; // 0–100
  className?: string;
  height?: number;
  showLabel?: boolean;
}

export default function ProgressBar({ value, className = '', height = 6, showLabel = false }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div
        className="flex-1 rounded-full overflow-hidden"
        style={{ height, background: 'rgba(255,255,255,0.06)' }}
      >
        <div
          className="h-full rounded-full progress-fill transition-all duration-700"
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-400 tabular-nums w-8 text-right shrink-0">
          {clamped}%
        </span>
      )}
    </div>
  );
}
