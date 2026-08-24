import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Bell, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { dashboardApi } from '@/api/dashboard.api'
import { usePermission } from '@/hooks/usePermission'
import { formatDate } from '@/lib/utils'

const APPROVAL_BADGES: Array<{ key: 'leave' | 'loan' | 'serviceRequest' | 'todo'; label: string }> = [
  { key: 'leave', label: 'Leave' },
  { key: 'loan', label: 'Loans' },
  { key: 'serviceRequest', label: 'Tickets' },
  { key: 'todo', label: 'Todos' },
]

// GET /dashboards/admin-alerts requires onboarding:manage server-side —
// self-gate on the exact same permission so this widget never fires a
// request that 403s for roles that lack it.
export function NotificationsRemindersWidget() {
  const canSeeAlerts = usePermission('onboarding:manage')

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-admin-alerts'],
    queryFn: () => dashboardApi.adminAlerts(),
    enabled: canSeeAlerts,
  })

  if (!canSeeAlerts) return null

  const items = data?.onboardingLinksExpiringSoon.items ?? []
  const approvals = data?.pendingApprovals

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="h-4 w-4 text-primary" />
          Notifications & Reminders
        </CardTitle>
        <Link to="/onboarding" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
          View All <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <p className="text-sm text-destructive">Failed to load notifications & reminders.</p>
            <button
              onClick={() => refetch()}
              className="text-xs font-medium text-primary hover:text-primary/80"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Onboarding Links Expiring Soon
              </p>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2 text-center">No onboarding links expiring soon.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {item.candidateName ?? item.email}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          Expires {formatDate(item.expiresAt)}
                        </p>
                      </div>
                      <StatusBadge status={item.status} type="onboarding" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                Pending Approvals
              </p>
              <div className="grid grid-cols-4 gap-2">
                {APPROVAL_BADGES.map(({ key, label }) => (
                  <div key={key} className="rounded-lg border border-border p-2 text-center">
                    <p className="text-sm font-semibold text-foreground">{approvals?.[key] ?? 0}</p>
                    <p className="text-[10px] text-muted-foreground">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
