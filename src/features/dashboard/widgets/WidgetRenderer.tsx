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
    kpi_total_employees: { icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
    kpi_active_employees: { icon: UserCheck, color: 'text-accent-green', bg: 'bg-accent-green/10' },
    kpi_on_leave: { icon: Calendar, color: 'text-accent-orange', bg: 'bg-accent-orange/10' },
    kpi_attendance_rate: { icon: BarChart3, color: 'text-primary', bg: 'bg-primary/10' },
    kpi_pending_approvals: { icon: Clock, color: 'text-accent-orange', bg: 'bg-accent-orange/10' },
    kpi_payroll_total: { icon: CreditCard, color: 'text-primary', bg: 'bg-primary/10' },
    kpi_open_loans: { icon: TrendingUp, color: 'text-accent-orange', bg: 'bg-accent-orange/10' },
    kpi_open_assets: { icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
    kpi_open_tickets: { icon: Clock, color: 'text-accent-orange', bg: 'bg-accent-orange/10' },
    kpi_my_leave_balance: { icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
    kpi_my_performance: { icon: Activity, color: 'text-primary', bg: 'bg-primary/10' },
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
