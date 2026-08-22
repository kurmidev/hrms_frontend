import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClipboardCheck, Plus, Send, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { todosApi } from '@/api/incentives.api'
import type { TodoTask } from '@/types/incentives.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/store/auth.store'
import { formatDate } from '@/lib/utils'
import { CreateTodoDialog } from './CreateTodoDialog'
import { SubmitTodoDialog } from './SubmitTodoDialog'
import { ApproveTodoDialog } from './ApproveTodoDialog'

export function TodosPage() {
  const { page, limit, setPage } = usePagination()
  const canApprove = usePermission('todo:approve')
  const currentEmployeeId = useAuthStore((s) => s.user?.employee?.id) ?? null

  const [createOpen, setCreateOpen] = useState(false)
  const [submitTarget, setSubmitTarget] = useState<TodoTask | null>(null)
  const [reviewTarget, setReviewTarget] = useState<TodoTask | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['todos', { page, limit }],
    queryFn: () => todosApi.list({ page, limit }),
  })

  const todos = (data as { data?: TodoTask[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const columns: Column<TodoTask>[] = [
    { key: 'title', header: 'Title' },
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
    { key: 'incentiveRule', header: 'Rule', render: (row) => row.incentiveRule?.name ?? '—' },
    {
      key: 'quantity',
      header: 'Quantity',
      render: (row) => (row.quantity != null ? `${row.quantity}${row.unit ? ` ${row.unit}` : ''}` : '—'),
    },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} type="todo" /> },
    { key: 'dueDate', header: 'Due Date', render: (row) => (row.dueDate ? formatDate(row.dueDate) : '—') },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          {(row.status === 'PENDING' || row.status === 'REJECTED') && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                setSubmitTarget(row)
              }}
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Submit
            </Button>
          )}
          {canApprove &&
            row.status === 'SUBMITTED' &&
            !(currentEmployeeId != null && row.employeeId === currentEmployeeId) && (
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
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <ClipboardCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{canApprove ? 'Todos' : 'My Todos'}</h1>
            <p className="text-sm text-muted-foreground">{meta?.total ?? 0} tasks</p>
          </div>
        </div>
        <Button onClick={() => setCreateOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          New Todo
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={todos}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        rowKey={(r) => r.id}
        emptyMessage="No todos found."
      />

      <CreateTodoDialog open={createOpen} onOpenChange={setCreateOpen} />

      <SubmitTodoDialog
        open={!!submitTarget}
        onOpenChange={(o) => !o && setSubmitTarget(null)}
        todo={submitTarget}
      />

      <ApproveTodoDialog
        open={!!reviewTarget}
        onOpenChange={(o) => !o && setReviewTarget(null)}
        todo={reviewTarget}
      />
    </div>
  )
}
