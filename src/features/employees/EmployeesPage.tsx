import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Users, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { employeesApi } from '@/api/employees.api'
import type { Employee } from '@/types/employee.types'
import { EMPLOYMENT_TYPE_LABELS } from '@/lib/constants'
import { getInitials, formatDate } from '@/lib/utils'
import { usePagination } from '@/hooks/usePagination'

export function EmployeesPage() {
  const navigate = useNavigate()
  const { page, limit, setPage, reset } = usePagination()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [employmentType, setEmploymentType] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['employees', { page, limit, search, status, employmentType }],
    queryFn: () => employeesApi.list({
      page, limit,
      search: search || undefined,
      status: status || undefined,
      employmentType: employmentType || undefined,
    }),
  })

  const employees: Employee[] = (data as { data?: Employee[] })?.data ?? []
  const meta = (data as { meta?: { total: number; page: number; limit: number; totalPages: number } })?.meta

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
    { key: 'department', header: 'Department', render: (row) => row.department?.name ?? '—' },
    { key: 'designation', header: 'Designation', render: (row) => row.designation?.name ?? '—' },
    {
      key: 'employmentType',
      header: 'Type',
      render: (row) => (
        <span className="text-xs text-muted-foreground">
          {EMPLOYMENT_TYPE_LABELS[row.employmentType]}
        </span>
      ),
    },
    { key: 'joiningDate', header: 'Joined', render: (row) => formatDate(row.joiningDate) },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} type="employee" />,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Users className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Employees</h1>
          <p className="text-sm text-muted-foreground">
            {meta?.total ?? 0} total employees
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name, email, code…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); reset() }}
            className="pl-9 w-64"
          />
        </div>
        <Select value={status} onValueChange={(v) => { setStatus(v ?? ''); reset() }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {['PRE_BOARDING', 'ACTIVE', 'ON_LEAVE', 'SUSPENDED', 'EXITED'].map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={employmentType} onValueChange={(v) => { setEmploymentType(v ?? ''); reset() }}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={employees}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/employees/${row.id}`)}
        rowKey={(r) => r.id}
        emptyMessage="No employees found."
      />
    </div>
  )
}
