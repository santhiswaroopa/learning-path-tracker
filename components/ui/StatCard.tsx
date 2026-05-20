interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ReactNode;
  iconBg?: string;
  trend?: { value: string; positive: boolean };
  className?: string;
  style?: React.CSSProperties;
}

export default function StatCard({
  label,
  value,
  sub,
  icon,
  iconBg = 'linear-gradient(135deg, #8b5cf6, #6366f1)',
  trend,
  className = '',
  style,
}: StatCardProps) {
  return (
    <div
      className={`card-hover rounded-xl p-5 flex flex-col gap-4 ${className}`}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        ...style,
      }}
    >
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: iconBg }}
        >
          {icon}
        </div>

        {/* Trend badge */}
        {trend && (
          <span
            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
              trend.positive ? 'text-emerald-400' : 'text-red-400'
            }`}
            style={{
              background: trend.positive ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
              border: `1px solid ${trend.positive ? 'rgba(52,211,153,0.2)' : 'rgba(248,113,113,0.2)'}`,
            }}
          >
            {trend.positive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>

      <div>
        <p className="text-2xl font-bold text-slate-100 tabular-nums leading-none">{value}</p>
        <p className="text-xs text-slate-500 mt-1 font-medium">{label}</p>
        {sub && <p className="text-[11px] text-slate-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}
