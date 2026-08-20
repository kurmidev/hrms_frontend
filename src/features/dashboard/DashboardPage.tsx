import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Users, UserCheck, Building2, Shield, Settings2, CreditCard, Clock, TrendingUp, BarChart3, ListTodo, ArrowRight, CircleCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { employeesApi } from '@/api/employees.api'
import { dashboardApi } from '@/api/dashboard.api'
import { todosApi } from '@/api/incentives.api'
import type { EmployeeStats } from '@/types/employee.types'
import type { TodoTask } from '@/types/incentives.types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { usePermission } from '@/hooks/usePermission'
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

const EMPLOYMENT_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ec4899']

const OPEN_TODO_STATUSES = new Set(['PENDING', 'SUBMITTED'])
const MAX_DASHBOARD_TODOS = 5

interface StatCardData {
  title: string
  value: number | string
  icon: React.ElementType
  color: string
  bg: string
  href?: string
}

interface StatCardProps {
  card: StatCardData
  isLoading: boolean
}

function StatCard({ card, isLoading }: StatCardProps) {
  // Bug (2026-08-20): several cards format `value` as a display string (e.g.
  // Attendance % renders "95%", not the number 95) so `typeof card.value ===
  // 'number'` was always false for them and the href never activated no
  // matter the underlying data — silently dead links. Parse the leading
  // numeric portion of whatever `value` actually is instead of requiring it
  // to already be a `number`.
  const numericValue = typeof card.value === 'number' ? card.value : parseFloat(card.value)
  const isLinkable = !!card.href && !Number.isNaN(numericValue) && numericValue > 0

  const content = (
    <CardContent className="p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{card.title}</p>
          {isLoading ? (
            <Skeleton className="h-8 w-16 mt-1" />
          ) : (
            <p className="text-3xl font-bold text-foreground mt-1">{card.value}</p>
          )}
          {isLinkable && !isLoading && (
            <span className="flex items-center gap-1 text-xs font-medium text-blue-600 mt-1.5">
              View details
              <ArrowRight className="h-3 w-3" />
            </span>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.bg}`}>
          <card.icon className={`h-6 w-6 ${card.color}`} />
        </div>
      </div>
    </CardContent>
  )

  if (isLinkable) {
    return (
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <Link to={card.href as string}>{content}</Link>
      </Card>
    )
  }

  return <Card className="shadow-sm">{content}</Card>
}

export function DashboardPage() {
  // GET /todos requires todo:create server-side (see TodosController) — several
  // seeded roles (hr_manager, finance_manager, dept_manager, field_supervisor,
  // it_admin) do NOT hold it, so this widget must self-gate with the exact same
  // permission string rather than firing a request that always 403s for them.
  const canSeeTasks = usePermission('todo:create')

  const { data: stats, isLoading: empLoading } = useQuery<EmployeeStats>({
    queryKey: ['employee-stats'],
    queryFn: () => employeesApi.getStats(),
  })

  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard-kpis'],
    queryFn: () => dashboardApi.kpis(),
  })

  const { data: todosData, isLoading: todosLoading } = useQuery({
    queryKey: ['dashboard-my-todos'],
    queryFn: () => todosApi.list({ limit: 20 }),
    enabled: canSeeTasks,
  })

  const myTodos: TodoTask[] = ((todosData as { data?: TodoTask[] })?.data ?? [])
    .filter((t) => OPEN_TODO_STATUSES.has(t.status))
    .slice(0, MAX_DASHBOARD_TODOS)

  const totalEmployees = stats?.total ?? 0
  const activeCount = stats?.byStatus['ACTIVE'] ?? 0
  const onboardingCount = stats?.byStatus['PRE_BOARDING'] ?? 0
  const deptCount = stats?.byDepartment.length ?? 0

  const statusData = Object.entries(stats?.byStatus ?? {}).map(([name, value]) => ({ name, value }))
  const typeData = Object.entries(stats?.byType ?? {}).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">Overview of your organization</p>
        </div>
        <button
          onClick={() => toast.info('Dashboard customization coming soon')}
          className="flex items-center gap-2 border border-border text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg text-sm transition-colors"
        >
          <Settings2 className="h-4 w-4" />
          Customize
        </button>
      </div>

      {/* My Tasks widget — only rendered for roles holding todo:create (matches
          GET /todos' server-side @RequirePermissions) */}
      {canSeeTasks && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-blue-600" />
              My Tasks
            </CardTitle>
            <Link
              to="/incentives/todos"
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              View All
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </CardHeader>
          <CardContent>
            {todosLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full rounded-lg" />)}
              </div>
            ) : myTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <CircleCheck className="h-8 w-8 text-emerald-500 mb-2" />
                <p className="text-sm text-muted-foreground">No pending tasks. You're all caught up.</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {myTodos.map((todo) => (
                  <li key={todo.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{todo.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {todo.dueDate ? `Due ${formatDate(todo.dueDate)}` : 'No due date'}
                        {todo.incentiveRule ? ` · ${todo.incentiveRule.name}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={todo.status} type="todo" />
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'Total Employees', value: totalEmployees, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50', href: '/employees' },
          { title: 'Active', value: activeCount, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', href: '/employees?status=active' },
          { title: 'Pre-Boarding', value: onboardingCount, icon: Shield, color: 'text-violet-600', bg: 'bg-violet-50', href: '/onboarding' },
          { title: 'Departments', value: deptCount, icon: Building2, color: 'text-amber-600', bg: 'bg-amber-50', href: '/organization/departments' },
        ].map((card) => (
          <StatCard key={card.title} card={card} isLoading={empLoading} />
        ))}
      </div>

      {/* Real-time KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            title: 'Payroll Cost',
            value: kpis?.kpi_payroll_total != null ? formatCurrency(kpis.kpi_payroll_total) : '—',
            icon: CreditCard,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            title: 'Pending Approvals',
            value: kpis?.kpi_pending_approvals ?? '—',
            icon: Clock,
            color: 'text-yellow-600',
            bg: 'bg-yellow-50',
            href: '/performance/kpis',
          },
          {
            title: 'Active Loans',
            value: kpis?.kpi_open_loans ?? '—',
            icon: TrendingUp,
            color: 'text-indigo-600',
            bg: 'bg-indigo-50',
            href: '/loans',
          },
          {
            title: 'Attendance %',
            value: kpis?.kpi_attendance_rate != null ? `${kpis.kpi_attendance_rate}%` : '—',
            icon: BarChart3,
            color: 'text-purple-600',
            bg: 'bg-purple-50',
            href: '/attendance',
          },
        ].map((card) => (
          <StatCard key={card.title} card={card} isLoading={kpisLoading} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Employees by Status</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Employees by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={typeData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {typeData.map((_entry, index) => (
                    <Cell key={index} fill={EMPLOYMENT_COLORS[index % EMPLOYMENT_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
