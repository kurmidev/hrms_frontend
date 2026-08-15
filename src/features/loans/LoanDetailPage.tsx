import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Receipt } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { loanApi } from '@/api/loan.api'
import type { LoanEmiSchedule } from '@/types/loan.types'
import { usePermission } from '@/hooks/usePermission'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { ApproveLoanDialog } from './ApproveLoanDialog'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatPeriod(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1] ?? month} ${year}`
}

export function LoanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const canApprove = usePermission('loan:approve')

  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)

  const { data: loan, isLoading: loanLoading } = useQuery({
    queryKey: ['loan', id],
    queryFn: () => loanApi.get(id as string),
    enabled: !!id,
  })

  const { data: schedule, isLoading: scheduleLoading } = useQuery({
    queryKey: ['loan-emi-schedule', id],
    queryFn: () => loanApi.getEmiSchedule(id as string),
    enabled: !!id,
  })

  const { mutate: reject, isPending: rejecting } = useMutation({
    mutationFn: () => {
      if (!id) return Promise.reject(new Error('No loan id'))
      return loanApi.reject(id, {})
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loan', id] })
      qc.invalidateQueries({ queryKey: ['loans'] })
      setRejectOpen(false)
      toast.success('Loan application rejected.')
    },
    onError: () => toast.error('Failed to reject loan application.'),
  })

  const emiColumns: Column<LoanEmiSchedule>[] = [
    { key: 'installmentNo', header: '#', render: (row) => row.installmentNo },
    { key: 'period', header: 'Period', render: (row) => formatPeriod(row.emiMonth, row.emiYear) },
    { key: 'emiAmount', header: 'EMI', render: (row) => formatCurrency(row.emiAmount) },
    { key: 'principal', header: 'Principal', render: (row) => formatCurrency(row.principal) },
    { key: 'interest', header: 'Interest', render: (row) => formatCurrency(row.interest) },
    { key: 'outstandingBalance', header: 'Outstanding', render: (row) => formatCurrency(row.outstandingBalance) },
    { key: 'dueDate', header: 'Due Date', render: (row) => formatDate(row.dueDate) },
    {
      key: 'isDeducted',
      header: 'Deducted',
      render: (row) => (
        <Badge
          className={`border-0 text-xs font-medium ${row.isDeducted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
          variant="secondary"
        >
          {row.isDeducted ? 'Yes' : 'No'}
        </Badge>
      ),
    },
    { key: 'paidAt', header: 'Paid At', render: (row) => (row.paidAt ? formatDate(row.paidAt) : '—') },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/loans')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Receipt className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          {loanLoading ? (
            <Skeleton className="h-6 w-40" />
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                {loan ? `${loan.employee.firstName} ${loan.employee.lastName}` : 'Loan Application'}
              </h1>
              {loan && <StatusBadge status={loan.status} type="loan" />}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {loan ? `${loan.employee.empCode} · ${loan.employee.departmentName ?? '—'}` : ''}
          </p>
        </div>
        {canApprove && loan?.status === 'PENDING' && (
          <div className="flex items-center gap-2">
            <Button variant="outline" className="text-destructive hover:text-destructive" onClick={() => setRejectOpen(true)}>
              Reject
            </Button>
            <Button onClick={() => setApproveOpen(true)}>Approve</Button>
          </div>
        )}
      </div>

      {loanLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : loan ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Amount Requested</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(loan.amountRequested)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Amount Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {loan.amountApproved != null ? formatCurrency(loan.amountApproved) : '—'}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Interest Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {loan.interestRate != null ? `${loan.interestRate}%` : '—'}
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Tenure</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">
                {loan.tenureMonths != null ? `${loan.tenureMonths} mo` : '—'}
              </p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {loan && (loan.reason || loan.disbursedAt || loan.closedAt) && (
        <Card className="shadow-sm">
          <CardContent className="pt-6 space-y-2 text-sm">
            {loan.reason && (
              <p><span className="font-medium text-foreground">Reason: </span><span className="text-muted-foreground">{loan.reason}</span></p>
            )}
            {loan.disbursedAt && (
              <p><span className="font-medium text-foreground">Disbursed: </span><span className="text-muted-foreground">{formatDate(loan.disbursedAt)}</span></p>
            )}
            {loan.closedAt && (
              <p><span className="font-medium text-foreground">Closed: </span><span className="text-muted-foreground">{formatDate(loan.closedAt)}</span></p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">EMI Schedule</h2>
        <DataTable
          columns={emiColumns}
          data={schedule ?? []}
          isLoading={scheduleLoading}
          rowKey={(r) => r.id}
          emptyMessage="No EMI schedule generated yet."
        />
      </div>

      <ApproveLoanDialog open={approveOpen} onOpenChange={setApproveOpen} loan={loan ?? null} />

      <ConfirmDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        title="Reject Loan Application"
        description="Reject this loan application?"
        confirmLabel={rejecting ? 'Rejecting…' : 'Reject'}
        variant="destructive"
        onConfirm={() => reject()}
      />
    </div>
  )
}
