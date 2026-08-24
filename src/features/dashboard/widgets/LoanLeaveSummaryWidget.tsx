import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { HandCoins, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { dashboardApi } from '@/api/dashboard.api'
import { usePermission } from '@/hooks/usePermission'
import { formatCurrency } from '@/lib/utils'

// GET /dashboards/loan-leave-summary requires BOTH loan:read and leave:read
// server-side — self-gate on both so this widget never fires a request that
// 403s for a role holding only one of the two.
export function LoanLeaveSummaryWidget() {
  const canSeeLoans = usePermission('loan:read')
  const canSeeLeave = usePermission('leave:read')
  const canSeeSummary = canSeeLoans && canSeeLeave

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['dashboard-loan-leave-summary'],
    queryFn: () => dashboardApi.loanLeaveSummary(),
    enabled: canSeeSummary,
  })

  if (!canSeeSummary) return null

  const loans = data?.loans
  const leave = data?.leave

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <HandCoins className="h-4 w-4 text-primary" />
          Loan & Leave Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <p className="text-sm text-destructive">Failed to load loan & leave summary.</p>
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
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Loans</p>
                <Link to="/loans" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-lg font-semibold text-foreground">{loans?.pendingCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(loans?.pendingAmount ?? 0)}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-lg font-semibold text-foreground">{loans?.activeCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(loans?.activeOutstandingAmount ?? 0)} outstanding</p>
                </div>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Leave</p>
                <Link to="/leave" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
                  View All <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-lg font-semibold text-foreground">{leave?.pendingCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-lg font-semibold text-foreground">{leave?.onLeaveToday ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Today</p>
                </div>
                <div className="rounded-lg border border-border p-3 text-center">
                  <p className="text-lg font-semibold text-foreground">{leave?.onLeaveThisWeek ?? 0}</p>
                  <p className="text-xs text-muted-foreground">This Week</p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
