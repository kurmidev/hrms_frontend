import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Ticket, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { serviceRequestApi } from '@/api/service-request.api'
import type { ServiceRequest, ServiceRequestCategory, ServiceRequestStatus } from '@/types/service-request.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { formatDate } from '@/lib/utils'
import { RaiseServiceRequestDialog } from './RaiseServiceRequestDialog'

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-slate-100 text-slate-600',
  ASSIGNED: 'bg-amber-100 text-amber-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-gray-200 text-gray-700',
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-100 text-slate-600',
  MEDIUM: 'bg-blue-100 text-blue-700',
  HIGH: 'bg-orange-100 text-orange-700',
  CRITICAL: 'bg-red-100 text-red-700',
}

const CATEGORIES: ServiceRequestCategory[] = ['HR', 'IT', 'ADMIN', 'COMPLIANCE', 'FINANCE', 'POLICY_CLARIFICATION']
const STATUSES: ServiceRequestStatus[] = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']

export function ServiceRequestsPage() {
  const navigate = useNavigate()
  const { page, limit, setPage } = usePagination()
  const canManage = usePermission('service_request:manage')
  const canRead = usePermission('service_request:read')
  const canCreate = usePermission('service_request:create')
  const [category, setCategory] = useState<ServiceRequestCategory | ''>('')
  const [status, setStatus] = useState<ServiceRequestStatus | ''>('')
  const [raiseOpen, setRaiseOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['service-requests', { page, limit, category, status }],
    queryFn: () =>
      serviceRequestApi.list({
        page,
        limit,
        category: category || undefined,
        status: status || undefined,
      }),
    enabled: canRead,
  })

  const rows = (data as { data?: ServiceRequest[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const columns: Column<ServiceRequest>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-foreground">{row.title}</p>
          <p className="text-xs text-muted-foreground">
            {row.isAnonymous || !row.employee
              ? 'Anonymous'
              : `${row.employee.firstName} ${row.employee.lastName} (${row.employee.empCode})`}
          </p>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: (row) => row.category.replace('_', ' ') },
    {
      key: 'priority',
      header: 'Priority',
      render: (row) => (
        <Badge className={`border-0 text-xs font-medium ${PRIORITY_COLORS[row.priority]}`} variant="secondary">
          {row.priority}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge className={`border-0 text-xs font-medium ${STATUS_COLORS[row.status]}`} variant="secondary">
          {row.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'slaDeadline',
      header: 'SLA Deadline',
      render: (row) => (row.slaDeadline ? formatDate(row.slaDeadline) : '—'),
    },
    { key: 'createdAt', header: 'Raised', render: (row) => formatDate(row.createdAt) },
  ]

  if (!canRead) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Ticket className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Service Requests</h1>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          You do not have permission to view service requests.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Ticket className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Service Requests</h1>
            <p className="text-sm text-muted-foreground">
              {meta?.total ?? 0} {canManage ? 'requests' : 'of your requests'}
            </p>
          </div>
        </div>
        {canCreate && (
          <Button size="sm" onClick={() => setRaiseOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Raise Request
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Select value={category} onValueChange={(v) => setCategory((v as ServiceRequestCategory) ?? '')}>
          <SelectTrigger className="w-52"><SelectValue placeholder="All categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus((v as ServiceRequestStatus) ?? '')}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/service-requests/${row.id}`)}
        rowKey={(r) => r.id}
        emptyMessage="No service requests found."
      />

      <RaiseServiceRequestDialog open={raiseOpen} onOpenChange={setRaiseOpen} />
    </div>
  )
}
