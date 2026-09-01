import { Bell, Building2, CalendarDays, Clock, CreditCard, HeartHandshake, Receipt, type LucideIcon } from 'lucide-react'

/**
 * Static/illustrative marketing panel shown alongside the login form.
 * This page is unauthenticated — every number and chart here is a
 * representative sample, NOT live data pulled from any API. Do not
 * wire this to a real endpoint.
 */

interface FeaturePill {
  label: string
  icon: LucideIcon
  tint: 'primary' | 'orange'
}

const FEATURE_PILLS: FeaturePill[] = [
  { label: 'Attendance', icon: Clock, tint: 'primary' },
  { label: 'Leave', icon: CalendarDays, tint: 'primary' },
  { label: 'Payroll', icon: CreditCard, tint: 'primary' },
  { label: 'Department', icon: Building2, tint: 'primary' },
  { label: 'Loan', icon: Receipt, tint: 'orange' },
  { label: 'Green Thanks', icon: HeartHandshake, tint: 'primary' },
]

// Illustrative sample values only — not sourced from any live API.
const SAMPLE_STATS = [
  { label: 'Present', value: 96, className: 'text-primary' },
  { label: 'Absent', value: 113, className: 'text-accent-red' },
  { label: 'On leave', value: 0, className: 'text-foreground' },
  { label: 'Late', value: 16, className: 'text-accent-orange' },
]

// Illustrative sample bar heights (percent) for the "Daily shifts" mini chart.
const SAMPLE_SHIFT_BARS = [40, 65, 50, 80, 55, 90, 35, 70]

// Illustrative sample ring segments (must sum to <= 100).
const RING_SEGMENTS = [
  { pct: 55, color: 'var(--primary)' },
  { pct: 25, color: '#D9D9D9' },
  { pct: 20, color: 'var(--accent-orange)' },
]

function FeaturePillBadge({ label, icon: Icon, tint }: FeaturePill) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm">
      <span
        className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          tint === 'orange' ? 'bg-accent-orange' : 'bg-primary'
        }`}
      >
        <Icon className="h-3.5 w-3.5 text-white" />
      </span>
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  )
}

function RingChart() {
  const radius = 34
  const circumference = 2 * Math.PI * radius
  let offsetAccumulated = 0

  return (
    <svg viewBox="0 0 80 80" className="h-24 w-24 -rotate-90">
      <circle cx="40" cy="40" r={radius} fill="none" stroke="#EEF1EC" strokeWidth="8" />
      {RING_SEGMENTS.map((segment) => {
        const segmentLength = (segment.pct / 100) * circumference
        const dashArray = `${segmentLength} ${circumference - segmentLength}`
        const dashOffset = -offsetAccumulated
        offsetAccumulated += segmentLength
        return (
          <circle
            key={segment.color}
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke={segment.color}
            strokeWidth="8"
            strokeDasharray={dashArray}
            strokeDashoffset={dashOffset}
            strokeLinecap="round"
          />
        )
      })}
    </svg>
  )
}

export function AuthMarketingPanel() {
  return (
    <div className="hidden lg:flex h-full w-full flex-col justify-center gap-8 bg-gradient-to-br from-[#EAF7E0] via-[#F3FAEE] to-white px-12 py-12 xl:px-20">
      <div className="flex flex-wrap gap-3">
        {FEATURE_PILLS.map((pill) => (
          <FeaturePillBadge key={pill.label} {...pill} />
        ))}
      </div>

      <div className="rounded-3xl bg-white p-6 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">Attendance Overview</h3>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-white">
            AD
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-6">
          {SAMPLE_STATS.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className={`text-xl font-bold ${stat.className}`}>{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-6 items-center">
          <div>
            <div className="flex items-end gap-1.5 h-16">
              {SAMPLE_SHIFT_BARS.map((height, i) => (
                <div
                  key={i}
                  className="w-2.5 rounded-full bg-primary/80"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-2">Daily shifts</p>
          </div>

          <div className="flex flex-col items-center">
            <div className="relative flex items-center justify-center">
              <RingChart />
              <span className="absolute text-lg font-bold text-foreground">209</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total employees</p>
          </div>
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-2xl xl:text-3xl font-bold text-foreground leading-tight">
          Built for teams that are growing fast.
        </h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
          Attendance, leave, payroll and onboarding — one calm place to run your team.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm cursor-default"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-secondary">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
          <span className="text-sm font-medium text-foreground">Guide</span>
        </a>
        <a
          href="#"
          onClick={(e) => e.preventDefault()}
          className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 shadow-sm cursor-default"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-secondary">
            <Bell className="h-3.5 w-3.5 text-muted-foreground" />
          </span>
          <span className="text-sm font-medium text-foreground">What's new</span>
        </a>
      </div>
    </div>
  )
}
