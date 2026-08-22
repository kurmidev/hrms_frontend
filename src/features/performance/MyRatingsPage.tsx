import { useQuery } from '@tanstack/react-query'
import { Target } from 'lucide-react'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { performanceApi } from '@/api/performance.api'
import type { PerformanceRating } from '@/types/performance.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-secondary text-secondary-foreground',
  ACTIVE: 'bg-accent-green/10 text-accent-green',
  CLOSED: 'bg-accent-orange/10 text-accent-orange',
}

export function MyRatingsPage() {
  const { page, limit, setPage } = usePagination()

  const { data, isLoading } = useQuery({
    queryKey: ['my-performance-ratings', { page, limit }],
    queryFn: () => performanceApi.myRatings({ page, limit }),
  })

  const ratings = (data as { data?: PerformanceRating[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const columns: Column<PerformanceRating>[] = [
    {
      key: 'cycle',
      header: 'Cycle',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{row.cycle?.name ?? '—'}</span>
          {row.cycle && (
            <StatusBadge status={row.cycle.status} type="generic" colorClass={STATUS_COLORS[row.cycle.status]} />
          )}
        </div>
      ),
    },
    { key: 'rating', header: 'Rating', render: (row) => `${row.rating} / 5` },
    {
      key: 'isEligibleForIncrement',
      header: 'Increment Eligible',
      render: (row) => (row.isEligibleForIncrement ? 'Yes' : 'No'),
    },
    { key: 'comments', header: 'Comments', render: (row) => row.comments ?? '—' },
    { key: 'submittedAt', header: 'Submitted', render: (row) => formatDate(row.submittedAt) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Target className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">My Ratings</h1>
          <p className="text-sm text-muted-foreground">{meta?.total ?? 0} ratings across all cycles</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={ratings}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        rowKey={(r) => r.id}
        emptyMessage="You have no performance ratings yet."
      />
    </div>
  )
}
