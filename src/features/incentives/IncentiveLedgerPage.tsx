import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Wallet, Unlock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { incentiveLedgerApi } from '@/api/incentives.api'
import type { IncentiveLedgerEntry } from '@/types/incentives.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { formatCurrency } from '@/lib/utils'
import { ReleaseIncentiveDialog } from './ReleaseIncentiveDialog'

export function IncentiveLedgerPage() {
  const { page, limit, setPage } = usePagination()
  const canApprove = usePermission('todo:approve')
  const [releaseTarget, setReleaseTarget] = useState<IncentiveLedgerEntry | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['incentive-ledger', { page, limit }],
    queryFn: () => incentiveLedgerApi.list({ page, limit }),
  })

  const entries = (data as { data?: IncentiveLedgerEntry[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const columns: Column<IncentiveLedgerEntry>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (row) =>
        row.employee ? (
          <div>
            <p className="text-sm font-medium text-foreground">
              {row.employee.firstName} {row.employee.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{row.employee.empCode}</p>
          </div>
        ) : (
          '—'
        ),
    },
    { key: 'source', header: 'Source' },
    { key: 'totalAmount', header: 'Total', render: (row) => formatCurrency(row.totalAmount) },
    { key: 'holdAmount', header: 'Hold', render: (row) => formatCurrency(row.holdAmount) },
    { key: 'releaseAmount', header: 'Release', render: (row) => formatCurrency(row.releaseAmount) },
    { key: 'payrollPeriod', header: 'Period', render: (row) => `${row.payrollMonth}/${row.payrollYear}` },
    {
      key: 'flags',
      header: 'Status',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          <StatusBadge
            status={row.isHeld ? 'HELD' : 'NOT_HELD'}
            type="generic"
            label={row.isHeld ? 'Held' : 'Not Held'}
            colorClass={row.isHeld ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}
          />
          <StatusBadge
            status={row.isReleased ? 'RELEASED' : 'PENDING'}
            type="generic"
            label={row.isReleased ? 'Released' : 'Pending'}
            colorClass={row.isReleased ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}
          />
          <StatusBadge
            status={row.isDeducted ? 'DEDUCTED' : 'NOT_DEDUCTED'}
            type="generic"
            label={row.isDeducted ? 'Deducted' : 'Not Deducted'}
            colorClass={row.isDeducted ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}
          />
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) =>
        canApprove && row.isHeld && !row.isDeducted ? (
          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation()
              setReleaseTarget(row)
            }}
          >
            <Unlock className="h-3.5 w-3.5 mr-1" />
            Release
          </Button>
        ) : null,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Wallet className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Incentive Ledger</h1>
            <p className="text-sm text-muted-foreground">{meta?.total ?? 0} entries</p>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={entries}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        rowKey={(r) => r.id}
        emptyMessage="No incentive ledger entries found."
      />

      <ReleaseIncentiveDialog
        open={!!releaseTarget}
        onOpenChange={(o) => !o && setReleaseTarget(null)}
        entry={releaseTarget}
      />
    </div>
  )
}
