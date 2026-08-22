import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Target } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { performanceApi } from '@/api/performance.api'
import type { EmployeeKpiRow, EmployeeKpiStatus } from '@/types/performance.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  ACHIEVED: 'bg-emerald-100 text-emerald-700',
  MISSED: 'bg-red-100 text-red-700',
}

export function KpiPage() {
  const { page, limit, setPage } = usePagination()
  const [status, setStatus] = useState<EmployeeKpiStatus | ''>('')

  const { data, isLoading } = useQuery({
    queryKey: ['performance-kpis', { page, limit, status }],
    queryFn: () => performanceApi.listKpis({ page, limit, status: status || undefined }),
  })

  const kpis = (data as { data?: EmployeeKpiRow[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const columns: Column<EmployeeKpiRow>[] = [
    { key: 'employeeName', header: 'Employee' },
    { key: 'designationName', header: 'Designation', render: (row) => row.designationName ?? '—' },
    { key: 'kpiTitle', header: 'KPI Title' },
    {
      key: 'targetValue',
      header: 'Target',
      render: (row) => (row.targetValue != null ? `${row.targetValue} ${row.unit ?? ''}`.trim() : '—'),
    },
    {
      key: 'achievedValue',
      header: 'Achieved',
      render: (row) =>
        row.achievedValue != null ? `${row.achievedValue} ${row.unit ?? ''}`.trim() : '—',
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} type="generic" colorClass={STATUS_COLORS[row.status]} />,
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
            <h1 className="text-xl font-bold text-foreground">Employee KPIs</h1>
            <p className="text-sm text-muted-foreground">{meta?.total ?? 0} KPIs</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Select
          items={{ '': 'All statuses', PENDING: 'Pending', IN_PROGRESS: 'In Progress', ACHIEVED: 'Achieved', MISSED: 'Missed' }}
          value={status}
          onValueChange={(v) => setStatus((v as EmployeeKpiStatus) ?? '')}
        >
          <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="ACHIEVED">Achieved</SelectItem>
            <SelectItem value="MISSED">Missed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={kpis}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        rowKey={(r) => r.id}
        emptyMessage="No KPIs found."
      />
    </div>
  )
}
