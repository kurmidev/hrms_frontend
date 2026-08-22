import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Target, Plus, PlayCircle, StopCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { performanceApi } from '@/api/performance.api'
import type { PerformanceCycle, PerformanceCycleStatus } from '@/types/performance.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { formatDate, getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'
import { CreateCycleDialog } from './CreateCycleDialog'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-secondary text-secondary-foreground',
  ACTIVE: 'bg-accent-green/10 text-accent-green',
  CLOSED: 'bg-accent-orange/10 text-accent-orange',
}

export function PerformanceCyclesPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { page, limit, setPage } = usePagination()
  const canApprove = usePermission('performance:manage')

  const [status, setStatus] = useState<PerformanceCycleStatus | ''>('')
  const [createOpen, setCreateOpen] = useState(false)
  const [activateTarget, setActivateTarget] = useState<PerformanceCycle | null>(null)
  const [closeTarget, setCloseTarget] = useState<PerformanceCycle | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['performance-cycles', { page, limit, status }],
    queryFn: () => performanceApi.listCycles({ page, limit, status: status || undefined }),
  })

  const cycles = (data as { data?: PerformanceCycle[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const { mutate: activate, isPending: activating } = useMutation({
    mutationFn: (id: string) => performanceApi.activateCycle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['performance-cycles'] })
      setActivateTarget(null)
      toast.success('Performance cycle activated.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to activate performance cycle.')),
  })

  const { mutate: close, isPending: closing } = useMutation({
    mutationFn: (id: string) => performanceApi.closeCycle(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['performance-cycles'] })
      setCloseTarget(null)
      toast.success('Performance cycle closed.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to close performance cycle.')),
  })

  const columns: Column<PerformanceCycle>[] = [
    { key: 'name', header: 'Name' },
    { key: 'startDate', header: 'Start', render: (row) => formatDate(row.startDate) },
    { key: 'endDate', header: 'End', render: (row) => formatDate(row.endDate) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} type="generic" colorClass={STATUS_COLORS[row.status]} />,
    },
    { key: 'closedAt', header: 'Closed', render: (row) => (row.closedAt ? formatDate(row.closedAt) : '—') },
    {
      key: 'actions',
      header: '',
      render: (row) =>
        canApprove ? (
          <div className="flex items-center gap-1">
            {row.status === 'DRAFT' && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation()
                  setActivateTarget(row)
                }}
              >
                <PlayCircle className="h-3.5 w-3.5 mr-1" />
                Activate
              </Button>
            )}
            {row.status === 'ACTIVE' && (
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  setCloseTarget(row)
                }}
              >
                <StopCircle className="h-3.5 w-3.5 mr-1" />
                Close
              </Button>
            )}
          </div>
        ) : null,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Performance Cycles</h1>
            <p className="text-sm text-muted-foreground">{meta?.total ?? 0} cycles</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Create Cycle
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select
          items={{ '': 'All statuses', DRAFT: 'Draft', ACTIVE: 'Active', CLOSED: 'Closed' }}
          value={status}
          onValueChange={(v) => setStatus((v as PerformanceCycleStatus) ?? '')}
        >
          <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={cycles}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/performance/${row.id}`)}
        rowKey={(r) => r.id}
        emptyMessage="No performance cycles found."
      />

      <CreateCycleDialog open={createOpen} onOpenChange={setCreateOpen} />

      <ConfirmDialog
        open={!!activateTarget}
        onOpenChange={(o) => !o && setActivateTarget(null)}
        title="Activate Performance Cycle"
        description={`Activate "${activateTarget?.name}"? Managers will be able to submit ratings once active.`}
        confirmLabel={activating ? 'Activating…' : 'Activate'}
        onConfirm={() => activateTarget && activate(activateTarget.id)}
      />

      <ConfirmDialog
        open={!!closeTarget}
        onOpenChange={(o) => !o && setCloseTarget(null)}
        title="Close Performance Cycle"
        description={`Close "${closeTarget?.name}"? This locks the cycle and no further ratings can be submitted or edited.`}
        confirmLabel={closing ? 'Closing…' : 'Close'}
        variant="destructive"
        onConfirm={() => closeTarget && close(closeTarget.id)}
      />
    </div>
  )
}
