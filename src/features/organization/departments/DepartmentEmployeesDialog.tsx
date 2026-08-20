import { useQuery } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { usePagination } from '@/hooks/usePagination'
import { employeesApi } from '@/api/employees.api'
import type { Employee } from '@/types/employee.types'
import type { PaginatedMeta } from '@/types/api.types'
import { getInitials } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  department: { id: string; name: string } | null
}

export function DepartmentEmployeesDialog({ open, onOpenChange, department }: Props) {
  const { page, limit, setPage } = usePagination()

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['employees', 'by-department', department?.id, { page, limit }],
    queryFn: () => employeesApi.list({ departmentId: department!.id, page, limit }),
    enabled: open && !!department,
  })

  const rows = (data as { data?: Employee[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const columns: Column<Employee>[] = [
    {
      key: 'name',
      header: 'Employee',
      render: (row) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={row.profilePhotoUrl ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {getInitials(row.firstName, row.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium text-foreground">{row.firstName} {row.lastName}</p>
            <p className="text-xs text-muted-foreground">{row.empCode}</p>
          </div>
        </div>
      ),
    },
    { key: 'designation', header: 'Designation', render: (row) => row.designation?.name ?? '—' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} type="employee" />,
    },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Employees — {department?.name}</DialogTitle>
        </DialogHeader>
        {isError ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-muted-foreground">
              Failed to load employees for this department.
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? 'Retrying…' : 'Try again'}
            </Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={rows}
            isLoading={isLoading}
            pagination={meta}
            onPageChange={setPage}
            rowKey={(r) => r.id}
            emptyMessage="No employees in this department."
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
