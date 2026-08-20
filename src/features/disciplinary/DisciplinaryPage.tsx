import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AlertOctagon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { disciplinaryApi } from '@/api/disciplinary.api'
import { employeesApi } from '@/api/employees.api'
import type { DisciplinaryMemo, DisciplinaryActionType } from '@/types/disciplinary.types'
import type { Employee } from '@/types/employee.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { formatDate } from '@/lib/utils'
import { IssueMemoDialog } from './IssueMemoDialog'

const MEMO_TYPES: DisciplinaryActionType[] = ['VERBAL_WARNING', 'WRITTEN_WARNING', 'DEMOTION', 'SUSPENSION']

const TYPE_COLORS: Record<string, string> = {
  VERBAL_WARNING: 'bg-amber-100 text-amber-700',
  WRITTEN_WARNING: 'bg-orange-100 text-orange-700',
  DEMOTION: 'bg-red-100 text-red-700',
  SUSPENSION: 'bg-red-100 text-red-700',
}

export function DisciplinaryPage() {
  const { page, limit, setPage } = usePagination()
  const canManage = usePermission('exit:manage')

  const [type, setType] = useState<DisciplinaryActionType | ''>('')
  const [issueOpen, setIssueOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['disciplinary', { page, limit, type }],
    queryFn: () => disciplinaryApi.list({ page, limit, type: type || undefined }),
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

  const memos = (data as { data?: DisciplinaryMemo[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const columns: Column<DisciplinaryMemo>[] = [
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
    { key: 'title', header: 'Title', render: (row) => row.title },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge className={`border-0 text-xs font-medium ${TYPE_COLORS[row.type]}`} variant="secondary">
          {row.type.replace('_', ' ')}
        </Badge>
      ),
    },
    { key: 'status', header: 'Status', render: (row) => row.status },
    { key: 'issuedAt', header: 'Issued', render: (row) => formatDate(row.issuedAt) },
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
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <AlertOctagon className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Disciplinary Memos</h1>
            <p className="text-sm text-muted-foreground">{meta?.total ?? 0} memos</p>
          </div>
        </div>
        <Button size="sm" onClick={() => setIssueOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          Issue Memo
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select
          items={{ '': 'All types', ...Object.fromEntries(MEMO_TYPES.map((t) => [t, t.replace('_', ' ')])) }}
          value={type}
          onValueChange={(v) => setType((v as DisciplinaryActionType) ?? '')}
        >
          <SelectTrigger className="w-56"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {MEMO_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={memos}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        rowKey={(r) => r.id}
        emptyMessage="No disciplinary memos found."
      />

      <IssueMemoDialog open={issueOpen} onOpenChange={setIssueOpen} />
    </div>
  )
}
