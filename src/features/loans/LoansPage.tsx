import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Receipt, Plus, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { loanApi } from '@/api/loan.api'
import type { Loan } from '@/types/loan.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { ApplyLoanDialog } from './ApplyLoanDialog'
import { ApproveLoanDialog } from './ApproveLoanDialog'

export function LoansPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { page, limit, setPage } = usePagination()
  const canApprove = usePermission('loan:approve')

  const [applyOpen, setApplyOpen] = useState(false)
  const [approveTarget, setApproveTarget] = useState<Loan | null>(null)
  const [rejectTarget, setRejectTarget] = useState<Loan | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['loans', { page, limit }],
    queryFn: () => loanApi.list({ page, limit }),
  })

  const loans = (data as { data?: Loan[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const { mutate: reject, isPending: rejecting } = useMutation({
    mutationFn: (id: string) => loanApi.reject(id, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] })
      setRejectTarget(null)
      toast.success('Loan application rejected.')
    },
    onError: () => toast.error('Failed to reject loan application.'),
  })

  const columns: Column<Loan>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-foreground">
            {row.employee.firstName} {row.employee.lastName}
          </p>
          <p className="text-xs text-muted-foreground">{row.employee.empCode}</p>
        </div>
      ),
    },
    { key: 'amountRequested', header: 'Requested', render: (row) => formatCurrency(row.amountRequested) },
    {
      key: 'amountApproved',
      header: 'Approved',
      render: (row) => (row.amountApproved != null ? formatCurrency(row.amountApproved) : '—'),
    },
    { key: 'tenureMonths', header: 'Tenure', render: (row) => (row.tenureMonths != null ? `${row.tenureMonths} mo` : '—') },
    { key: 'interestRate', header: 'Rate', render: (row) => (row.interestRate != null ? `${row.interestRate}%` : '—') },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} type="loan" /> },
    { key: 'createdAt', header: 'Applied', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (row) =>
        canApprove && row.status === 'PENDING' ? (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                setApproveTarget(row)
              }}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                setRejectTarget(row)
              }}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reject
            </Button>
          </div>
        ) : null,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Receipt className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Loans</h1>
            <p className="text-sm text-muted-foreground">{meta?.total ?? 0} applications</p>
          </div>
        </div>
        <Button onClick={() => setApplyOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Apply for Loan
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={loans}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/loans/${row.id}`)}
        rowKey={(r) => r.id}
        emptyMessage="No loan applications found."
      />

      <ApplyLoanDialog open={applyOpen} onOpenChange={setApplyOpen} />

      <ApproveLoanDialog
        open={!!approveTarget}
        onOpenChange={(o) => !o && setApproveTarget(null)}
        loan={approveTarget}
      />

      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(o) => !o && setRejectTarget(null)}
        title="Reject Loan Application"
        description={`Reject the loan application from ${rejectTarget ? `${rejectTarget.employee.firstName} ${rejectTarget.employee.lastName}` : ''}?`}
        confirmLabel={rejecting ? 'Rejecting…' : 'Reject'}
        variant="destructive"
        onConfirm={() => rejectTarget && reject(rejectTarget.id)}
      />
    </div>
  )
}
