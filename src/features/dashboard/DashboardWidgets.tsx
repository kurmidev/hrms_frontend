import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Users, UserCheck, Shield, CreditCard, Clock, TrendingUp, BarChart3, ArrowRight,
  Wallet2, Ticket, Package, Star, CalendarClock, Activity, Radar, ListTodo, Sparkles,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { employeesApi } from '@/api/employees.api'
import { loanApi } from '@/api/loan.api'
import { leaveApi } from '@/api/leave.api'
import { attendanceApi } from '@/api/attendance.api'
import { todosApi } from '@/api/incentives.api'
import { greenThanksApi } from '@/api/green-thanks.api'
import type { AttendanceLog, LiveLocation } from '@/types/attendance.types'
import type { DashboardWidget } from '@/types/dashboard.types'
import type { DashboardKpis } from '@/types/reports.types'
import type { Employee, EmployeeStats } from '@/types/employee.types'
import type { Loan } from '@/types/loan.types'
import type { LeaveApplication } from '@/types/leave.types'
import type { TodoTask } from '@/types/incentives.types'
import type { GreenThanks } from '@/types/green-thanks.types'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: '#22c55e',
  PRE_BOARDING: '#3b82f6',
  ON_LEAVE: '#f59e0b',
  SUSPENDED: '#f97316',
  EXITED: '#94a3b8',
}
const DEPT_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6']

// Widgets whose value must be interpreted as a raw number for link-eligibility
// (rule §18: never gate on `typeof` after formatting for display).
interface KpiCardConfig {
  title: string
  icon: React.ElementType
  color: string
  bg: string
  href?: string
  format: (kpis: DashboardKpis) => string | number
}

// Recolored to the brand family (primary green / charcoal-neutral / accent
// orange / accent red) instead of the reference's blue/teal/indigo/purple
// defaults — grouped so related KPIs read as a coherent set:
//   - primary green  → headcount/people metrics (total, active, on-leave)
//   - charcoal/neutral → operational/financial metrics (attendance, payroll, loans)
//   - accent orange  → approvals/attention metrics (pending approvals, tickets, assets)
//   - accent red     → "my" personal metrics that need the user's attention (leave balance, performance)
const KPI_WIDGET_CONFIG: Record<string, KpiCardConfig> = {
  kpi_total_employees: {
    title: 'Total Employees', icon: Users, color: 'text-primary', bg: 'bg-primary/10', href: '/employees',
    format: (k) => k.kpi_total_employees ?? 0,
  },
  kpi_active_employees: {
    title: 'Active Employees', icon: UserCheck, color: 'text-primary', bg: 'bg-primary/10', href: '/employees?status=active',
    format: (k) => k.kpi_active_employees ?? 0,
  },
  kpi_on_leave: {
    title: 'On Leave Today', icon: CalendarClock, color: 'text-primary', bg: 'bg-primary/10', href: '/leave',
    format: (k) => k.kpi_on_leave ?? 0,
  },
  kpi_attendance_rate: {
    title: 'Attendance %', icon: BarChart3, color: 'text-foreground', bg: 'bg-foreground/10', href: '/attendance',
    format: (k) => (k.kpi_attendance_rate != null ? `${Number(k.kpi_attendance_rate).toFixed(2)}%` : '—'),
  },
  kpi_pending_approvals: {
    title: 'Pending Approvals', icon: Clock, color: 'text-accent-orange', bg: 'bg-accent-orange/10', href: '/performance/kpis',
    format: (k) => k.kpi_pending_approvals ?? 0,
  },
  kpi_payroll_total: {
    title: 'Payroll Cost', icon: CreditCard, color: 'text-foreground', bg: 'bg-foreground/10',
    format: (k) => (k.kpi_payroll_total != null ? formatCurrency(k.kpi_payroll_total) : '—'),
  },
  kpi_open_loans: {
    title: 'Active Loans', icon: TrendingUp, color: 'text-foreground', bg: 'bg-foreground/10', href: '/loans',
    format: (k) => k.kpi_open_loans ?? 0,
  },
  kpi_open_assets: {
    title: 'Open Assets', icon: Package, color: 'text-accent-orange', bg: 'bg-accent-orange/10', href: '/assets',
    format: (k) => k.kpi_open_assets ?? 0,
  },
  kpi_open_tickets: {
    title: 'Open Tickets', icon: Ticket, color: 'text-accent-orange', bg: 'bg-accent-orange/10', href: '/service-requests',
    format: (k) => k.kpi_open_tickets ?? 0,
  },
  kpi_my_leave_balance: {
    title: 'My Leave Balance', icon: Wallet2, color: 'text-accent-red', bg: 'bg-accent-red/10', href: '/leave/my',
    format: (k) => (k.kpi_my_leave_balance != null ? Number(k.kpi_my_leave_balance).toFixed(2) : '—'),
  },
  kpi_my_performance: {
    title: 'My Performance', icon: Star, color: 'text-accent-red', bg: 'bg-accent-red/10', href: '/performance/kpis',
    format: (k) => (k.kpi_my_performance != null ? Number(k.kpi_my_performance).toFixed(2) : '—'),
  },
}

interface KpiCardProps {
  widget: DashboardWidget
  kpis?: DashboardKpis
  isLoading: boolean
}

export function KpiWidgetCard({ widget, kpis, isLoading }: KpiCardProps) {
  const cfg = KPI_WIDGET_CONFIG[widget.widgetType]
  if (!cfg) return <UnknownWidgetCard widget={widget} />

  const rawValue = kpis ? cfg.format(kpis) : undefined
  const numericValue = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue))
  const isLinkable = !!cfg.href && !Number.isNaN(numericValue) && numericValue > 0

  // Tier-1 compact treatment: icon in a filled circular badge, a big number,
  // a label, and a small "View X" link underneath — matching the reference
  // layout's top KPI row structure while using our recolored brand palette.
  const content = (
    <CardContent className="p-5">
      <div className={`w-11 h-11 rounded-full flex items-center justify-center ${cfg.bg} mb-3`}>
        <cfg.icon className={`h-5 w-5 ${cfg.color}`} />
      </div>
      {isLoading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <p className="text-2xl font-bold text-foreground">{rawValue ?? '—'}</p>
      )}
      <p className="text-sm text-muted-foreground mt-0.5">{widget.title || cfg.title}</p>
      {isLinkable && !isLoading && (
        <span className="flex items-center gap-1 text-xs font-medium text-primary mt-1.5">
          View {cfg.title.toLowerCase()} <ArrowRight className="h-3 w-3" />
        </span>
      )}
    </CardContent>
  )

  if (isLinkable) {
    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <Link to={cfg.href as string}>{content}</Link>
      </Card>
    )
  }
  return <Card className="shadow-sm">{content}</Card>
}

interface SolidKpiBlock {
  label: string
  value: string | number
  bg: string
}

interface KpiSolidStripProps {
  kpis?: DashboardKpis
  isLoading: boolean
}

// Tier-2 treatment: reference has a second row of larger SOLID-COLOR blocks
// (big centered number + label, no icon). Rather than trying to classify
// which `kpi_*` widget types are "tier 2" (adds real complexity for no real
// benefit, since the widget grid is role-driven and varies per config), we
// render a dedicated 3-block strip here derived from the same `kpis` values
// already fetched for the tier-1 cards — three brand-colored solid blocks:
// primary green, charcoal, accent orange.
export function KpiSolidStrip({ kpis, isLoading }: KpiSolidStripProps) {
  const blocks: SolidKpiBlock[] = [
    { label: 'Total Employees', value: kpis?.kpi_total_employees ?? 0, bg: 'bg-primary' },
    { label: 'On Leave Today', value: kpis?.kpi_on_leave ?? 0, bg: 'bg-foreground' },
    { label: 'Pending Approvals', value: kpis?.kpi_pending_approvals ?? 0, bg: 'bg-accent-orange' },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {blocks.map((block) => (
        <div key={block.label} className={`rounded-xl ${block.bg} px-6 py-7 flex flex-col items-center justify-center text-center shadow-sm`}>
          {isLoading ? (
            <Skeleton className="h-9 w-16 bg-white/30" />
          ) : (
            <p className="text-4xl font-bold text-white">{block.value}</p>
          )}
          <p className="text-sm font-medium text-white/90 mt-1.5">{block.label}</p>
        </div>
      ))}
    </div>
  )
}

export function EmployeeStatusChartCard({ widget }: { widget: DashboardWidget }) {
  const { data: stats, isLoading } = useQuery<EmployeeStats>({
    queryKey: ['employee-stats'],
    queryFn: () => employeesApi.getStats(),
  })
  const statusData = Object.entries(stats?.byStatus ?? {}).map(([name, value]) => ({ name, value }))

  return (
    <Card className="shadow-sm h-full">
      <CardHeader><CardTitle className="text-base">{widget.title || 'Employees by Status'}</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-60 w-full" /> : (
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(2)}%`}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? '#94a3b8'} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

export function DepartmentHeadcountChartCard({ widget }: { widget: DashboardWidget }) {
  const { data: stats, isLoading } = useQuery<EmployeeStats>({
    queryKey: ['employee-stats'],
    queryFn: () => employeesApi.getStats(),
  })
  const deptData = stats?.byDepartment ?? []

  return (
    <Card className="shadow-sm h-full">
      <CardHeader><CardTitle className="text-base">{widget.title || 'Headcount by Department'}</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-60 w-full" /> : (
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={deptData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {deptData.map((_entry, index) => (
                  <Cell key={index} fill={DEPT_COLORS[index % DEPT_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}

export function RecentJoinersTableCard({ widget }: { widget: DashboardWidget }) {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-recent-joiners'],
    queryFn: () => employeesApi.list({ limit: 100 }),
  })
  const joiners = ((data as { data?: Employee[] })?.data ?? [])
    .slice()
    .sort((a, b) => new Date(b.joiningDate).getTime() - new Date(a.joiningDate).getTime())
    .slice(0, 5)

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{widget.title || 'Recent Joiners'}</CardTitle>
        <Link to="/employees" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : joiners.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No recent joiners.</p>
        ) : (
          <ul className="divide-y divide-border">
            {joiners.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{e.firstName} {e.lastName}</p>
                  <p className="text-xs text-muted-foreground">{e.department?.name ?? '—'}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{formatDate(e.joiningDate)}</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function PendingLoansTableCard({ widget }: { widget: DashboardWidget }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-pending-loans'],
    queryFn: () => loanApi.list({ status: 'PENDING', limit: 5 }),
  })
  const loans = (data as { data?: Loan[] })?.data ?? []

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{widget.title || 'Pending Loan Approvals'}</CardTitle>
        <Link to="/loans" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : isError ? (
          <p className="text-sm text-destructive py-4 text-center">Failed to load pending loans.</p>
        ) : loans.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No pending loan requests.</p>
        ) : (
          <ul className="divide-y divide-border">
            {loans.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{l.employee?.firstName} {l.employee?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(l.amountRequested)}</p>
                </div>
                <StatusBadge status={l.status} type="loan" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function PendingLeavesTableCard({ widget }: { widget: DashboardWidget }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-pending-leaves'],
    queryFn: () => leaveApi.list({ status: 'PENDING', limit: 5 }),
  })
  const applications = (data as { data?: LeaveApplication[] })?.data ?? []

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{widget.title || 'Pending Leave Requests'}</CardTitle>
        <Link to="/leave" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : isError ? (
          <p className="text-sm text-destructive py-4 text-center">Failed to load pending leaves.</p>
        ) : applications.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No pending leave requests.</p>
        ) : (
          <ul className="divide-y divide-border">
            {applications.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{a.employee?.firstName} {a.employee?.lastName}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(a.fromDate)} – {formatDate(a.toDate)} · {a.days}d</p>
                </div>
                <StatusBadge status={a.status} type="leave" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function UnknownWidgetCard({ widget }: { widget: DashboardWidget }) {
  return (
    <Card className="shadow-sm h-full border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-10 text-center gap-2">
        <Radar className="h-6 w-6 text-muted-foreground/60" />
        <p className="text-sm font-medium text-foreground">{widget.title}</p>
        <p className="text-xs text-muted-foreground">This widget isn't wired to live data yet.</p>
      </CardContent>
    </Card>
  )
}

export function ActivityPlaceholderCard({ widget }: { widget: DashboardWidget }) {
  return (
    <Card className="shadow-sm h-full">
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-primary" />{widget.title || 'Recent Activity'}</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground py-4 text-center">Activity feed coming soon.</p>
      </CardContent>
    </Card>
  )
}

export function ClockCheckinCard({ widget }: { widget: DashboardWidget }) {
  const today = new Date().toISOString().slice(0, 10)
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-my-attendance-today', today],
    queryFn: () => attendanceApi.myAttendance({ date: today, limit: 1 }),
  })
  const logs = (data as { data?: AttendanceLog[] })?.data ?? []
  const todayLog = logs[0]
  const hasCheckedIn = !!todayLog?.checkInAt
  const hasCheckedOut = !!todayLog?.checkOutAt

  return (
    <Card className="shadow-sm h-full">
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-primary" />{widget.title || "Today's Attendance"}</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-16 w-full" /> : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Check-in</p>
              <p className="text-lg font-semibold text-foreground">
                {hasCheckedIn ? new Date(todayLog!.checkInAt as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Check-out</p>
              <p className="text-lg font-semibold text-foreground">
                {hasCheckedOut ? new Date(todayLog!.checkOutAt as string).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
              </p>
            </div>
          </div>
        )}
        <Link to="/attendance/my" className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:text-primary/80 mt-4">
          Go to Attendance <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardContent>
    </Card>
  )
}

const OPEN_TODO_STATUSES = new Set(['PENDING', 'SUBMITTED'])
const MAX_WIDGET_ROWS = 5

// NOTE: this is a compact list, not a literal map. No map library (Leaflet,
// Mapbox, Google Maps, etc.) is installed and none is being added just for
// this single dashboard widget — `map_live_tracking` renders the same
// `LiveLocation[]` data the /attendance/live page returns, as a table.
export function LiveTrackingWidget({ widget }: { widget: DashboardWidget }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-live-tracking'],
    queryFn: () => attendanceApi.getLive(),
  })
  const locations = ((data as { data?: LiveLocation[] })?.data ?? [])
    .slice()
    .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())
    .slice(0, MAX_WIDGET_ROWS)

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Radar className="h-4 w-4 text-primary" />
          {widget.title || 'Live Tracking'}
        </CardTitle>
        <Link to="/attendance/live" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : isError ? (
          <p className="text-sm text-destructive py-4 text-center">Failed to load live locations.</p>
        ) : locations.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No field staff currently checked in.</p>
        ) : (
          <ul className="divide-y divide-border">
            {locations.map((loc) => (
              <li key={loc.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {loc.employee ? `${loc.employee.firstName} ${loc.employee.lastName}` : 'Unknown employee'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {loc.locationName || `${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">
                  {new Date(loc.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function MyTodosWidget({ widget }: { widget: DashboardWidget }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-my-todos'],
    queryFn: () => todosApi.list({ limit: 20 }),
  })
  const todos = ((data as { data?: TodoTask[] })?.data ?? [])
    .filter((t) => OPEN_TODO_STATUSES.has(t.status))
    .slice(0, MAX_WIDGET_ROWS)

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-primary" />
          {widget.title || 'Todo List'}
        </CardTitle>
        <Link to="/incentives/todos" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : isError ? (
          <p className="text-sm text-destructive py-4 text-center">Failed to load your tasks.</p>
        ) : todos.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No pending tasks.</p>
        ) : (
          <ul className="divide-y divide-border">
            {todos.map((todo) => (
              <li key={todo.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{todo.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {todo.dueDate ? `Due ${formatDate(todo.dueDate)}` : 'No due date'}
                  </p>
                </div>
                <StatusBadge status={todo.status} type="todo" />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function GreenThanksWidget({ widget }: { widget: DashboardWidget }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-green-thanks'],
    queryFn: () => greenThanksApi.list({ limit: 5 }),
  })
  const items = (data as { data?: GreenThanks[] })?.data ?? []

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {widget.title || 'Green Thanks'}
        </CardTitle>
        <Link to="/green-thanks" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
        ) : isError ? (
          <p className="text-sm text-destructive py-4 text-center">Failed to load Green Thanks.</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No Green Thanks yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((gt) => (
              <li key={gt.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {gt.fromEmployee ? `${gt.fromEmployee.firstName} ${gt.fromEmployee.lastName}` : 'Someone'}
                    {' → '}
                    {gt.toEmployee ? `${gt.toEmployee.firstName} ${gt.toEmployee.lastName}` : 'Someone'}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{gt.reason}</p>
                </div>
                <span className="text-xs font-semibold text-primary shrink-0">+{gt.points} pts</span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function ShieldPlaceholderCard({ widget }: { widget: DashboardWidget }) {
  return (
    <Card className="shadow-sm h-full">
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4 text-violet-600" />{widget.title}</CardTitle></CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground py-4 text-center">No data source available yet for this widget.</p>
      </CardContent>
    </Card>
  )
}
