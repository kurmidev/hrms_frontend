import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { leaveApi } from '@/api/leave.api'
import type { LeaveApplication } from '@/types/leave.types'
import { LEAVE_TYPE_LABELS, LEAVE_STATUS_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { toast } from 'sonner'

type DecisionMode = 'approve' | 'reject'

export function LeaveApprovalsPage() {
  const qc = useQueryClient()
  const { page, limit, setPage, reset } = usePagination()
  const canApprove = usePermission('leave:approve')
  const [status, setStatus] = useState('PENDING')
  const [decisionTarget, setDecisionTarget] = useState<LeaveApplication | null>(null)
  const [decisionMode, setDecisionMode] = useState<DecisionMode>('approve')
  const [note, setNote] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['leave-approvals', { page, limit, status }],
    queryFn: () => leaveApi.list({ page, limit, status: status || undefined }),
    enabled: canApprove,
  })

  const applications: LeaveApplication[] = (data as { data?: LeaveApplication[] })?.data ?? []
  const meta = (data as { meta?: { total: number; page: number; limit: number; totalPages: number } })?.meta

  const { mutate: decide, isPending } = useMutation({
    mutationFn: () => {
      if (!decisionTarget) return Promise.reject(new Error('No application selected'))
      return decisionMode === 'approve'
        ? leaveApi.approve(decisionTarget.id, { notes: note || undefined })
        : leaveApi.reject(decisionTarget.id, { rejectionNote: note || undefined })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-approvals'] })
      setDecisionTarget(null)
      setNote('')
      toast.success(decisionMode === 'approve' ? 'Leave approved.' : 'Leave rejected.')
    },
    onError: () => toast.error('Failed to record decision.'),
  })

  const openDecision = (row: LeaveApplication, mode: DecisionMode) => {
    setDecisionTarget(row)
    setDecisionMode(mode)
    setNote('')
  }

  const columns: Column<LeaveApplication>[] = [
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
          row.employeeId
        ),
    },
    {
      key: 'leavePolicy',
      header: 'Leave Type',
      render: (row) => row.leavePolicy?.name ?? LEAVE_TYPE_LABELS[row.leavePolicy?.leaveType ?? ''] ?? '—',
    },
    { key: 'fromDate', header: 'From', render: (row) => formatDate(row.fromDate) },
    { key: 'toDate', header: 'To', render: (row) => formatDate(row.toDate) },
    { key: 'days', header: 'Days' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} type="leave" /> },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) =>
        row.status === 'PENDING' ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => openDecision(row, 'approve')}>Approve</Button>
            <Button size="sm" variant="outline" onClick={() => openDecision(row, 'reject')}>Reject</Button>
          </div>
        ) : null,
    },
  ]

  if (!canApprove) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <CheckSquare className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Leave Approvals</h1>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          You do not have permission to approve leave applications.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <CheckSquare className="h-5 w-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Leave Approvals</h1>
          <p className="text-sm text-muted-foreground">{meta?.total ?? 0} applications</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={status} onValueChange={(v) => { setStatus(v ?? ''); reset() }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {Object.entries(LEAVE_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={applications}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        rowKey={(r) => r.id}
        emptyMessage="No leave applications found."
      />

      <AlertDialog open={!!decisionTarget} onOpenChange={(o) => !o && setDecisionTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {decisionMode === 'approve' ? 'Approve Leave Application' : 'Reject Leave Application'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {decisionTarget?.employee
                ? `${decisionTarget.employee.firstName} ${decisionTarget.employee.lastName}`
                : ''}{' '}
              — {decisionTarget ? formatDate(decisionTarget.fromDate) : ''} to {decisionTarget ? formatDate(decisionTarget.toDate) : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-1.5 px-1">
            <Textarea
              placeholder={decisionMode === 'approve' ? 'Optional notes…' : 'Rejection reason…'}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => decide()}
              className={decisionMode === 'reject' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {isPending ? 'Saving…' : decisionMode === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
