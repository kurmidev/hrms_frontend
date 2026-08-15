import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { payrollApi } from '@/api/payroll.api'
import type { PayrollRun } from '@/types/payroll.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { formatCurrency, formatDate } from '@/lib/utils'
import { InitiatePayrollDialog } from './InitiatePayrollDialog'

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function formatPeriod(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1] ?? month} ${year}`
}

export function PayrollRunsPage() {
  const navigate = useNavigate()
  const { page, limit, setPage } = usePagination()
  const [open, setOpen] = useState(false)
  const canRun = usePermission('payroll:run')
  const canView = usePermission('payroll:read')

  const { data, isLoading } = useQuery({
    queryKey: ['payroll-runs', { page, limit }],
    queryFn: () => payrollApi.listRuns({ page, limit }),
    enabled: canView,
  })

  const runs = (data as { data?: PayrollRun[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const columns: Column<PayrollRun>[] = [
    { key: 'period', header: 'Period', render: (row) => formatPeriod(row.month, row.year) },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} type="payroll" /> },
    { key: 'entryCount', header: 'Employees', render: (row) => row.entryCount },
    { key: 'totalGross', header: 'Gross', render: (row) => formatCurrency(row.totalGross) },
    { key: 'totalNet', header: 'Net', render: (row) => formatCurrency(row.totalNet) },
    { key: 'totalDeductions', header: 'Deductions', render: (row) => formatCurrency(row.totalDeductions) },
    { key: 'createdAt', header: 'Initiated', render: (row) => formatDate(row.createdAt) },
  ]

  if (!canView) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Payroll Runs</h1>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          You do not have permission to view payroll runs.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Payroll Runs</h1>
            <p className="text-sm text-muted-foreground">{meta?.total ?? 0} runs</p>
          </div>
        </div>
        {canRun && (
          <Button onClick={() => setOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Run Payroll
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={runs}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/payroll/runs/${row.id}`)}
        rowKey={(r) => r.id}
        emptyMessage="No payroll runs found."
      />

      <InitiatePayrollDialog open={open} onOpenChange={setOpen} />
    </div>
  )
}
