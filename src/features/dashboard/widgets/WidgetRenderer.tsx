import type { DashboardWidget } from '@/types/dashboard.types'
import { KpiCard } from './KpiCard'
import {
  Users,
  UserCheck,
  Calendar,
  BarChart3,
  Clock,
  Activity,
  Package,
  CreditCard,
  TrendingUp,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { LucideIcon } from 'lucide-react'

interface WidgetRendererProps {
  widget: DashboardWidget
  kpiValues?: Record<string, number | null>
}

function PlaceholderWidget({ title }: { title: string }) {
  return (
    <Card className="h-full shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-24 flex items-center justify-center text-muted-foreground text-xs">
          Widget coming soon
        </div>
      </CardContent>
    </Card>
  )
}

interface KpiConfig {
  icon: LucideIcon
  color: string
  bg: string
}

export function WidgetRenderer({ widget, kpiValues }: WidgetRendererProps) {
  const kpiMap: Record<string, KpiConfig> = {
    kpi_total_employees: { icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    kpi_active_employees: { icon: UserCheck, color: 'text-green-600', bg: 'bg-green-100' },
    kpi_on_leave: { icon: Calendar, color: 'text-orange-600', bg: 'bg-orange-100' },
    kpi_attendance_rate: { icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-100' },
    kpi_pending_approvals: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    kpi_payroll_total: { icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    kpi_open_loans: { icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    kpi_open_assets: { icon: Package, color: 'text-cyan-600', bg: 'bg-cyan-100' },
    kpi_open_tickets: { icon: Clock, color: 'text-rose-600', bg: 'bg-rose-100' },
    kpi_my_leave_balance: { icon: Calendar, color: 'text-teal-600', bg: 'bg-teal-100' },
    kpi_my_performance: { icon: Activity, color: 'text-violet-600', bg: 'bg-violet-100' },
  }

  if (widget.widgetType in kpiMap) {
    const config = kpiMap[widget.widgetType]
    return (
      <KpiCard
        title={widget.title}
        value={kpiValues?.[widget.widgetType] ?? null}
        icon={config.icon}
        color={config.color}
        bg={config.bg}
        isLoading={false}
      />
    )
  }

  return <PlaceholderWidget title={widget.title} />
}
