import React from 'react'

const colorConfig = {
  primary: {
    border: 'border-l-primary',
    iconBg: 'from-primary/30 to-primary/10',
    iconText: 'text-primary',
    glow: 'shadow-[0_0_24px_rgba(108,99,255,0.12)]',
    hoverGlow: 'hover:shadow-[0_4px_32px_rgba(108,99,255,0.22)]',
  },
  success: {
    border: 'border-l-success',
    iconBg: 'from-success/30 to-success/10',
    iconText: 'text-success',
    glow: 'shadow-[0_0_24px_rgba(0,212,160,0.10)]',
    hoverGlow: 'hover:shadow-[0_4px_32px_rgba(0,212,160,0.20)]',
  },
  error: {
    border: 'border-l-error',
    iconBg: 'from-error/30 to-error/10',
    iconText: 'text-error',
    glow: 'shadow-[0_0_24px_rgba(255,92,114,0.10)]',
    hoverGlow: 'hover:shadow-[0_4px_32px_rgba(255,92,114,0.20)]',
  },
  warning: {
    border: 'border-l-warning',
    iconBg: 'from-warning/30 to-warning/10',
    iconText: 'text-warning',
    glow: 'shadow-[0_0_24px_rgba(255,176,32,0.10)]',
    hoverGlow: 'hover:shadow-[0_4px_32px_rgba(255,176,32,0.20)]',
  },
  info: {
    border: 'border-l-info',
    iconBg: 'from-info/30 to-info/10',
    iconText: 'text-info',
    glow: 'shadow-[0_0_24px_rgba(62,207,255,0.10)]',
    hoverGlow: 'hover:shadow-[0_4px_32px_rgba(62,207,255,0.20)]',
  },
}

function TrendBadge({ trend }) {
  if (!trend) return null
  const isPositive = trend > 0
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
        isPositive
          ? 'bg-success/15 text-success'
          : 'bg-error/15 text-error'
      }`}
    >
      {isPositive ? (
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
          <path d="M6 9V3M3 6l3-3 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
          <path d="M6 3v6M3 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {Math.abs(trend)}%
    </span>
  )
}

export default function StatCard({ title, value, subtitle, icon, color = 'primary', loading = false, trend }) {
  const c = colorConfig[color] || colorConfig.primary

  if (loading) {
    return (
      <div className={`bg-surfaceCard border border-border border-l-4 ${c.border} rounded-xl p-5 ${c.glow}`}>
        <div className="flex items-start justify-between mb-4">
          <div className="skeleton h-4 w-28 rounded" />
          <div className="skeleton w-11 h-11 rounded-xl" />
        </div>
        <div className="space-y-2.5">
          <div className="skeleton h-7 w-32 rounded" />
          <div className="skeleton h-3.5 w-20 rounded" />
        </div>
      </div>
    )
  }

  return (
    <div
      className={`bg-surfaceCard border border-border border-l-4 ${c.border} rounded-xl p-5 ${c.glow} ${c.hoverGlow} transition-all duration-300 group`}
      style={{ '--hover-translate': '-2px' }}
      onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-2px)')}
      onMouseLeave={e => (e.currentTarget.style.transform = '')}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm font-medium text-textSecondary leading-snug">{title}</p>
        {icon && (
          <div
            className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.iconBg} flex items-center justify-center flex-shrink-0 ml-3`}
          >
            <span className={`text-xl ${c.iconText}`}>{icon}</span>
          </div>
        )}
      </div>

      <p className="text-2xl font-bold text-textPrimary tracking-tight mb-1.5">{value ?? '—'}</p>

      <div className="flex items-center gap-2 flex-wrap">
        {subtitle && (
          <p className="text-xs text-textMuted">{subtitle}</p>
        )}
        <TrendBadge trend={trend} />
      </div>
    </div>
  )
}
