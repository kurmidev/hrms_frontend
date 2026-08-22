import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { DoorOpen, Plus, AlertOctagon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { exitApi } from '@/api/exit.api'
import { employeesApi } from '@/api/employees.api'
import type { ExitRecord, ExitType, ExitStatus } from '@/types/exit.types'
import type { Employee } from '@/types/employee.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { formatDate } from '@/lib/utils'
import { InitiateExitDialog } from './InitiateExitDialog'

const EXIT_TYPES: ExitType[] = ['RESIGNATION', 'TERMINATION', 'ABSCONDING', 'RETIREMENT']
const EXIT_STATUSES: ExitStatus[] = ['INITIATED', 'CLEARANCE_PENDING', 'CLEARED', 'SETTLED', 'COMPLETED']

const STATUS_COLORS: Record<string, string> = {
  INITIATED: 'bg-secondary text-secondary-foreground',
  CLEARANCE_PENDING: 'bg-accent-orange/10 text-accent-orange',
  CLEARED: 'bg-accent-green/10 text-accent-green',
  SETTLED: 'bg-accent-green/10 text-accent-green',
  COMPLETED: 'bg-accent-green/10 text-accent-green',
}

export function ExitPage() {
  const navigate = useNavigate()
  const { page, limit, setPage } = usePagination()
  const canManage = usePermission('exit:manage')

  const [type, setType] = useState<ExitType | ''>('')
  const [status, setStatus] = useState<ExitStatus | ''>('')
  const [initiateOpen, setInitiateOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['exit', { page, limit, type, status }],
    queryFn: () => exitApi.list({ page, limit, type: type || undefined, status: status || undefined }),
    enabled: canManage,
  })

  const { data: employeesData } = useQuery({
    queryKey: ['employees', { forSelect: true }],
    queryFn: () => employeesApi.list({ limit: 100 }),
    enabled: canManage,
  })
  const employeeMap = useMemo(() => {
    const list = (employeesData as { data?: Employee[] })?.data ?? []
    return new Map(list.map((e) => [e.id, e]))
  }, [employeesData])

  const records = (data as { data?: ExitRecord[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const columns: Column<ExitRecord>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (row) => {
        const emp = employeeMap.get(row.employeeId)
        return emp ? (
          <div>
            <p className="text-sm font-medium text-foreground">{emp.firstName} {emp.lastName}</p>
            <p className="text-xs text-muted-foreground">{emp.empCode}</p>
          </div>
        ) : (
          <span className="text-sm text-muted-foreground">{row.employeeId}</span>
        )
      },
    },
    { key: 'type', header: 'Type', render: (row) => row.type },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge className={`border-0 text-xs font-medium ${STATUS_COLORS[row.status]}`} variant="secondary">
          {row.status.replace('_', ' ')}
        </Badge>
      ),
    },
    { key: 'initiatedAt', header: 'Initiated', render: (row) => formatDate(row.initiatedAt) },
    { key: 'lastWorkingDate', header: 'Last Working Day', render: (row) => (row.lastWorkingDate ? formatDate(row.lastWorkingDate) : '—') },
  ]

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertOctagon className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">You don't have access to this page.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <DoorOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Exit Management</h1>
            <p className="text-sm text-muted-foreground">{meta?.total ?? 0} exit records</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setInitiateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Initiate Exit
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select
          items={{ '': 'All types', ...Object.fromEntries(EXIT_TYPES.map((t) => [t, t])) }}
          value={type}
          onValueChange={(v) => setType((v as ExitType) ?? '')}
        >
          <SelectTrigger className="w-48"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {EXIT_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          items={{ '': 'All statuses', ...Object.fromEntries(EXIT_STATUSES.map((s) => [s, s.replace('_', ' ')])) }}
          value={status}
          onValueChange={(v) => setStatus((v as ExitStatus) ?? '')}
        >
          <SelectTrigger className="w-48"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            {EXIT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={records}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/exit/${row.id}`)}
        rowKey={(r) => r.id}
        emptyMessage="No exit records found."
      />

      <InitiateExitDialog open={initiateOpen} onOpenChange={setInitiateOpen} />
    </div>
  )
}
