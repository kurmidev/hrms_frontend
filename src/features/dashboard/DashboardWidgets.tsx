import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Users, UserCheck, Shield, CreditCard, Clock, TrendingUp, BarChart3, ArrowRight,
  Wallet2, Ticket, Package, Star, CalendarClock, Activity, Radar,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { employeesApi } from '@/api/employees.api'
import { loanApi } from '@/api/loan.api'
import { leaveApi } from '@/api/leave.api'
import { attendanceApi } from '@/api/attendance.api'
import type { AttendanceLog } from '@/types/attendance.types'
import type { DashboardWidget } from '@/types/dashboard.types'
import type { DashboardKpis } from '@/types/reports.types'
import type { Employee, EmployeeStats } from '@/types/employee.types'
import type { Loan } from '@/types/loan.types'
import type { LeaveApplication } from '@/types/leave.types'
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

const KPI_WIDGET_CONFIG: Record<string, KpiCardConfig> = {
  kpi_total_employees: {
    title: 'Total Employees', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', href: '/employees',
    format: (k) => k.kpi_total_employees ?? 0,
  },
  kpi_active_employees: {
    title: 'Active Employees', icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/employees?status=active',
    format: (k) => k.kpi_active_employees ?? 0,
  },
  kpi_on_leave: {
    title: 'On Leave Today', icon: CalendarClock, color: 'text-amber-600', bg: 'bg-amber-50', href: '/leave',
    format: (k) => k.kpi_on_leave ?? 0,
  },
  kpi_attendance_rate: {
    title: 'Attendance %', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50', href: '/attendance',
    format: (k) => (k.kpi_attendance_rate != null ? `${k.kpi_attendance_rate}%` : '—'),
  },
  kpi_pending_approvals: {
    title: 'Pending Approvals', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', href: '/performance/kpis',
    format: (k) => k.kpi_pending_approvals ?? 0,
  },
  kpi_payroll_total: {
    title: 'Payroll Cost', icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50',
    format: (k) => (k.kpi_payroll_total != null ? formatCurrency(k.kpi_payroll_total) : '—'),
  },
  kpi_open_loans: {
    title: 'Active Loans', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50', href: '/loans',
    format: (k) => k.kpi_open_loans ?? 0,
  },
  kpi_open_assets: {
    title: 'Open Assets', icon: Package, color: 'text-cyan-600', bg: 'bg-cyan-50', href: '/assets',
    format: (k) => k.kpi_open_assets ?? 0,
  },
  kpi_open_tickets: {
    title: 'Open Tickets', icon: Ticket, color: 'text-rose-600', bg: 'bg-rose-50', href: '/service-requests',
    format: (k) => k.kpi_open_tickets ?? 0,
  },
  kpi_my_leave_balance: {
    title: 'My Leave Balance', icon: Wallet2, color: 'text-teal-600', bg: 'bg-teal-50', href: '/leave/my',
    format: (k) => (k.kpi_my_leave_balance != null ? k.kpi_my_leave_balance : '—'),
  },
  kpi_my_performance: {
    title: 'My Performance', icon: Star, color: 'text-orange-600', bg: 'bg-orange-50', href: '/performance/kpis',
    format: (k) => (k.kpi_my_performance != null ? k.kpi_my_performance : '—'),
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

  const content = (
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{widget.title || cfg.title}</p>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <p className="text-3xl font-bold text-foreground mt-1">{rawValue ?? '—'}</p>
          )}
          {isLinkable && !isLoading && (
            <span className="flex items-center gap-1 text-xs font-medium text-blue-600 mt-1.5">
              View details <ArrowRight className="h-3 w-3" />
            </span>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cfg.bg}`}>
          <cfg.icon className={`h-6 w-6 ${cfg.color}`} />
        </div>
      </div>
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
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
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
        <Link to="/employees" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
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
        <Link to="/loans" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
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
        <Link to="/leave" className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700">
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
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-blue-600" />{widget.title || 'Recent Activity'}</CardTitle></CardHeader>
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
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-blue-600" />{widget.title || "Today's Attendance"}</CardTitle></CardHeader>
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
        <Link to="/attendance/my" className="flex items-center justify-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 mt-4">
          Go to Attendance <ArrowRight className="h-3.5 w-3.5" />
        </Link>
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
