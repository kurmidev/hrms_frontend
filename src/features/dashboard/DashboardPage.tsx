import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ListTodo, ArrowRight, CircleCheck, Settings2 } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { dashboardApi } from '@/api/dashboard.api'
import { todosApi } from '@/api/incentives.api'
import { useAuthStore } from '@/store/auth.store'
import type { DashboardConfig, DashboardWidget } from '@/types/dashboard.types'
import type { TodoTask } from '@/types/incentives.types'
import type { DashboardKpis } from '@/types/reports.types'
import { formatDate } from '@/lib/utils'
import { usePermission } from '@/hooks/usePermission'
import {
  KpiWidgetCard, KpiSolidStrip, EmployeeStatusChartCard, DepartmentHeadcountChartCard, RecentJoinersTableCard,
  PendingLoansTableCard, PendingLeavesTableCard, ActivityPlaceholderCard, ClockCheckinCard,
  ShieldPlaceholderCard, UnknownWidgetCard, LiveTrackingWidget, LoanLeaveSummaryWidget, NotificationsWidget,
  MyTodosWidget, GreenThanksWidget,
} from './DashboardWidgets'
import { NoticeBoardWidget } from './widgets/NoticeBoardWidget'
import { HolidaysWidget } from './widgets/HolidaysWidget'

const OPEN_TODO_STATUSES = new Set(['PENDING', 'SUBMITTED'])
const MAX_DASHBOARD_TODOS = 5

const KPI_WIDGET_TYPES = new Set([
  'kpi_total_employees', 'kpi_active_employees', 'kpi_attendance_rate', 'kpi_pending_approvals',
  'kpi_payroll_total', 'kpi_open_loans', 'kpi_on_leave', 'kpi_my_leave_balance', 'kpi_my_performance',
  'kpi_open_assets', 'kpi_open_tickets',
])

const COL_SPAN_CLASS: Record<number, string> = {
  1: 'lg:col-span-1',
  2: 'lg:col-span-2',
  3: 'lg:col-span-3',
  4: 'lg:col-span-4',
}

// Picks the most specific dashboard config available: personal config for
// this user, else the role-default config matching one of the user's roles,
// else the first config returned. Matches `GET /dashboards` returning
// `DashboardConfig[]` (personal + role-default) per the integration contract.
function selectDashboardConfig(
  configs: DashboardConfig[],
  userId: string | undefined,
  roleNames: string[],
): DashboardConfig | undefined {
  const personal = configs.find((c) => c.userId === userId)
  if (personal) return personal
  const roleDefault = configs.find((c) => c.isDefault && c.roleName && roleNames.includes(c.roleName))
  if (roleDefault) return roleDefault
  return configs[0]
}

function renderWidget(widget: DashboardWidget, kpis: DashboardKpis | undefined, kpisLoading: boolean) {
  if (KPI_WIDGET_TYPES.has(widget.widgetType)) {
    return <KpiWidgetCard widget={widget} kpis={kpis} isLoading={kpisLoading} />
  }
  switch (widget.widgetType) {
    case 'chart_employee_status':
      return <EmployeeStatusChartCard widget={widget} />
    case 'chart_department_headcount':
      return <DepartmentHeadcountChartCard widget={widget} />
    case 'table_recent_joiners':
      return <RecentJoinersTableCard widget={widget} />
    case 'table_pending_loans':
      return <PendingLoansTableCard widget={widget} />
    case 'table_pending_leaves':
      return <PendingLeavesTableCard widget={widget} />
    case 'clock_checkin':
      return <ClockCheckinCard widget={widget} />
    case 'activity_recent':
      return <ActivityPlaceholderCard widget={widget} />
    case 'map_live_tracking':
      return <LiveTrackingWidget widget={widget} />
    case 'table_loan_leave_summary':
      return <LoanLeaveSummaryWidget widget={widget} />
    case 'list_notifications':
      return <NotificationsWidget widget={widget} />
    case 'list_my_todos':
      return <MyTodosWidget widget={widget} />
    case 'widget_green_thanks':
      return <GreenThanksWidget widget={widget} />
    case 'list_notices':
      return <NoticeBoardWidget />
    case 'chart_payroll_trend':
    case 'table_late_arrivals':
    case 'schedule_upcoming':
      return <ShieldPlaceholderCard widget={widget} />
    default:
      return <UnknownWidgetCard widget={widget} />
  }
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user)
  // GET /todos requires todo:read server-side (see TodosController @Get()) —
  // several seeded roles (hr_manager, finance_manager, it_admin) do NOT hold
  // it, so this widget must self-gate with the exact same permission string
  // rather than firing a request that always 403s for them. Do NOT gate on
  // todo:create here — dept_manager/field_supervisor hold todo:read (and can
  // legitimately call this endpoint) but not todo:create, so gating on the
  // wrong string silently hides a widget they're allowed to see.
  const canSeeTasks = usePermission('todo:read')

  const { data: dashboardConfigs, isLoading: configLoading } = useQuery({
    queryKey: ['dashboards'],
    queryFn: () => dashboardApi.list(),
  })

  const { data: kpis, isLoading: kpisLoading } = useQuery<DashboardKpis>({
    queryKey: ['dashboard-kpis'],
    queryFn: () => dashboardApi.kpis(),
  })

  const roleNames = (user?.roles ?? []).map((r) => r.name)
  const config = selectDashboardConfig(dashboardConfigs ?? [], user?.id, roleNames)
  const widgets = (config?.widgets ?? []).slice().sort((a, b) => a.position - b.position)

  // The widget grid can now itself render notices (`list_notices`) and todos
  // (`list_my_todos`) — avoid showing the hardcoded bottom-row Notice Board
  // and top "My Tasks" block a second time for roles whose config already
  // includes them, while still keeping the hardcoded fallbacks for roles
  // whose dashboard config doesn't.
  const hasNoticesWidget = widgets.some((w) => w.widgetType === 'list_notices')
  const hasTodosWidget = widgets.some((w) => w.widgetType === 'list_my_todos')

  const { data: todosData, isLoading: todosLoading } = useQuery({
    queryKey: ['dashboard-my-todos'],
    queryFn: () => todosApi.list({ limit: 20 }),
    enabled: canSeeTasks && !hasTodosWidget,
  })

  const myTodos: TodoTask[] = ((todosData as { data?: TodoTask[] })?.data ?? [])
    .filter((t) => OPEN_TODO_STATUSES.has(t.status))
    .slice(0, MAX_DASHBOARD_TODOS)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {config?.name ? config.name : 'Overview of your organization'}
          </p>
        </div>
        <button
          onClick={() => toast.info('Dashboard customization coming soon')}
          className="flex items-center gap-2 border border-border text-muted-foreground hover:text-foreground px-3 py-2 rounded-lg text-sm transition-colors"
        >
          <Settings2 className="h-4 w-4" />
          Customize
        </button>
      </div>

      {/* My Tasks widget — only rendered for roles holding todo:read (matches
          GET /todos' server-side @RequirePermissions), and only when the
          widget grid below doesn't already render `list_my_todos`. */}
      {canSeeTasks && !hasTodosWidget && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary" />
              My Tasks
            </CardTitle>
            <Link
              to="/incentives/todos"
              className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors"
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

      {/* Tier-2 solid-block KPI strip — see KpiSolidStrip for why this is a
          dedicated strip rather than classifying individual widget types. */}
      <KpiSolidStrip kpis={kpis} isLoading={kpisLoading} />

      {/* Role-aware widget grid — driven entirely by the user's DashboardConfig
          (personal config, else role-default) from GET /dashboards. */}
      {configLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
      ) : widgets.length === 0 ? (
        <Card className="shadow-sm border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-2">
            <p className="text-sm font-medium text-foreground">No dashboard configured yet</p>
            <p className="text-xs text-muted-foreground">Your organization hasn't set up a dashboard for your role.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
          {widgets.map((widget) => (
            <div key={widget.id ?? `${widget.widgetType}-${widget.position}`} className={`col-span-1 ${COL_SPAN_CLASS[widget.colSpan] ?? ''}`}>
              {renderWidget(widget, kpis, kpisLoading)}
            </div>
          ))}
        </div>
      )}

      {/* Notice Board + Holidays — bottom row, reusing existing APIs only.
          Notice Board is skipped here when the widget grid above already
          renders it via a `list_notices` widget, to avoid showing it twice. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {!hasNoticesWidget && <NoticeBoardWidget />}
        <HolidaysWidget />
      </div>
    </div>
  )
}
