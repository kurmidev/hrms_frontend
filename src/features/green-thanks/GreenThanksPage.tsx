import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { HeartHandshake, Plus, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { greenThanksApi } from '@/api/green-thanks.api'
import type { GreenThanks, GreenThanksDirection, GreenThanksStatus } from '@/types/green-thanks.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/store/auth.store'
import { formatDate } from '@/lib/utils'
import { SendGreenThanksDialog } from './SendGreenThanksDialog'
import { ApproveGreenThanksDialog } from './ApproveGreenThanksDialog'

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-accent-orange/10 text-accent-orange',
  approved: 'bg-accent-green/10 text-accent-green',
  rejected: 'bg-accent-red/10 text-accent-red',
}

export function GreenThanksPage() {
  const { page, limit, setPage } = usePagination()
  const canApprove = usePermission('leave:approve')
  const currentEmployeeId = useAuthStore((s) => s.user?.employee?.id) ?? null

  const [direction, setDirection] = useState<GreenThanksDirection | ''>('')
  const [status, setStatus] = useState<GreenThanksStatus | ''>('')
  const [sendOpen, setSendOpen] = useState(false)
  const [reviewTarget, setReviewTarget] = useState<GreenThanks | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['green-thanks', { page, limit, direction, status }],
    queryFn: () =>
      greenThanksApi.list({
        page,
        limit,
        direction: direction || undefined,
        status: status || undefined,
      }),
  })

  const { data: configData } = useQuery({
    queryKey: ['green-thanks-config'],
    queryFn: () => greenThanksApi.getConfig(),
  })

  const rows = (data as { data?: GreenThanks[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const columns: Column<GreenThanks>[] = [
    {
      key: 'fromEmployee',
      header: 'From',
      render: (row) =>
        row.fromEmployee ? (
          <div>
            <p className="text-sm font-medium text-foreground">
              {row.fromEmployee.firstName} {row.fromEmployee.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{row.fromEmployee.empCode}</p>
          </div>
        ) : (
          '—'
        ),
    },
    {
      key: 'toEmployee',
      header: 'To',
      render: (row) =>
        row.toEmployee ? (
          <div>
            <p className="text-sm font-medium text-foreground">
              {row.toEmployee.firstName} {row.toEmployee.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{row.toEmployee.empCode}</p>
          </div>
        ) : (
          '—'
        ),
    },
    {
      key: 'points',
      header: 'Points',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-foreground">{row.points}</p>
          {configData && (
            <p className="text-xs text-muted-foreground">
              ₹{(row.points * configData.inrPerPoint).toLocaleString()}
            </p>
          )}
        </div>
      ),
    },
    { key: 'reason', header: 'Reason', render: (row) => <span className="line-clamp-2">{row.reason}</span> },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} type="generic" colorClass={STATUS_COLORS[row.status]} />,
    },
    { key: 'createdAt', header: 'Sent On', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (row) => {
        const isOwnRecord =
          currentEmployeeId != null &&
          (row.fromEmployeeId === currentEmployeeId || row.toEmployeeId === currentEmployeeId)
        return (
        <div className="flex items-center gap-1">
          {canApprove && row.status === 'pending' && !isOwnRecord && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                setReviewTarget(row)
              }}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Review
            </Button>
          )}
        </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent-green/10 rounded-xl flex items-center justify-center">
            <HeartHandshake className="h-5 w-5 text-accent-green" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Green Thanks</h1>
            <p className="text-sm text-muted-foreground">{meta?.total ?? 0} entries</p>
          </div>
        </div>
        <Button onClick={() => setSendOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Send Green Thanks
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select
          items={{ '': 'All', sent: 'Sent', received: 'Received' }}
          value={direction}
          onValueChange={(v) => setDirection((v as GreenThanksDirection) ?? '')}
        >
          <SelectTrigger className="w-40"><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="received">Received</SelectItem>
          </SelectContent>
        </Select>
        <Select
          items={{ '': 'All statuses', pending: 'Pending', approved: 'Approved', rejected: 'Rejected' }}
          value={status}
          onValueChange={(v) => setStatus((v as GreenThanksStatus) ?? '')}
        >
          <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        rowKey={(r) => r.id}
        emptyMessage="No Green Thanks found."
      />

      <SendGreenThanksDialog open={sendOpen} onOpenChange={setSendOpen} />

      <ApproveGreenThanksDialog
        open={!!reviewTarget}
        onOpenChange={(o) => !o && setReviewTarget(null)}
        greenThanks={reviewTarget}
      />
    </div>
  )
}
