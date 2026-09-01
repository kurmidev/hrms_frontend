import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { payrollApi } from '@/api/payroll.api'
import type { PayrollEntry } from '@/types/payroll.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { formatCurrency, getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function formatPeriod(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1] ?? month} ${year}`
}

export function PayrollRunDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { page, limit, setPage } = usePagination()
  const canApprove = usePermission('payroll:approve')
  const canEdit = usePermission('payroll:run')

  const [approveOpen, setApproveOpen] = useState(false)
  const [disburseOpen, setDisburseOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<PayrollEntry | null>(null)
  const [remarks, setRemarks] = useState('')

  const { data: run, isLoading: runLoading } = useQuery({
    queryKey: ['payroll-run', id],
    queryFn: () => payrollApi.getRun(id as string),
    enabled: !!id,
  })

  const { data, isLoading: entriesLoading } = useQuery({
    queryKey: ['payroll-run-entries', id, { page, limit }],
    queryFn: () => payrollApi.listEntries(id as string, { page, limit }),
    enabled: !!id,
  })

  const entries = (data as { data?: PayrollEntry[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const { mutate: approve, isPending: approving } = useMutation({
    mutationFn: () => payrollApi.approveRun(id as string),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll-run', id] })
      qc.invalidateQueries({ queryKey: ['payroll-runs'] })
      setApproveOpen(false)
      toast.success('Payroll run approved.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to approve payroll run.')),
  })

  const { mutate: disburse, isPending: disbursing } = useMutation({
    mutationFn: () => payrollApi.disburseRun(id as string),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll-run', id] })
      qc.invalidateQueries({ queryKey: ['payroll-runs'] })
      setDisburseOpen(false)
      toast.success('Payroll run disbursed.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to disburse payroll run.')),
  })

  const { mutate: updateEntry, isPending: savingEntry } = useMutation({
    mutationFn: () => {
      if (!selectedEntry || !id) return Promise.reject(new Error('No entry selected'))
      return payrollApi.updateEntry(id, selectedEntry.employeeId, { remarks: remarks || undefined })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll-run-entries', id] })
      setSelectedEntry(null)
      toast.success('Entry updated.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to update entry.')),
  })

  const openEntry = (entry: PayrollEntry) => {
    setSelectedEntry(entry)
    setRemarks(entry.remarks ?? '')
  }

  const runStatus = run?.status
  const isLocked = runStatus === 'APPROVED' || runStatus === 'DISBURSED'

  const columns: Column<PayrollEntry>[] = [
    { key: 'empCode', header: 'Emp Code', render: (row) => row.employee.empCode },
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-foreground">
            {row.employee.firstName} {row.employee.lastName}
          </p>
          {row.employee.departmentName && (
            <p className="text-xs text-muted-foreground">{row.employee.departmentName}</p>
          )}
        </div>
      ),
    },
    { key: 'grossSalary', header: 'Gross', render: (row) => formatCurrency(row.grossSalary) },
    { key: 'lopDays', header: 'LOP Days', render: (row) => row.lopDays },
    { key: 'pfEmployee', header: 'PF', render: (row) => formatCurrency(row.pfEmployee) },
    { key: 'esiEmployee', header: 'ESI', render: (row) => formatCurrency(row.esiEmployee) },
    { key: 'tds', header: 'TDS', render: (row) => formatCurrency(row.tds) },
    { key: 'netSalary', header: 'Net', render: (row) => formatCurrency(row.netSalary) },
    { key: 'remarks', header: 'Remarks', render: (row) => row.remarks ?? '—' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/payroll')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-emerald-600" />
        </div>
        <div className="flex-1">
          {runLoading ? (
            <Skeleton className="h-6 w-40" />
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                {run ? formatPeriod(run.month, run.year) : 'Payroll Run'}
              </h1>
              {run && <StatusBadge status={run.status} type="payroll" />}
            </div>
          )}
          <p className="text-sm text-muted-foreground">{meta?.total ?? run?.entryCount ?? 0} employees</p>
        </div>
        {canApprove && runStatus === 'COMPLETED' && (
          <Button onClick={() => setApproveOpen(true)}>Approve</Button>
        )}
        {canApprove && runStatus === 'APPROVED' && (
          <Button onClick={() => setDisburseOpen(true)}>Disburse</Button>
        )}
      </div>

      {runLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : run ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Gross</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(run.totalGross)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Deductions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(run.totalDeductions)}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Net</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{formatCurrency(run.totalNet)}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        data={entries}
        isLoading={entriesLoading}
        pagination={meta}
        onPageChange={setPage}
        onRowClick={openEntry}
        rowKey={(r) => r.id}
        emptyMessage="No payroll entries found."
      />

      <Sheet open={!!selectedEntry} onOpenChange={(o) => !o && setSelectedEntry(null)}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {selectedEntry ? `${selectedEntry.employee.firstName} ${selectedEntry.employee.lastName}` : 'Payslip'}
            </SheetTitle>
          </SheetHeader>
          {selectedEntry && (
            <div className="flex flex-col gap-4 px-4 flex-1 overflow-y-auto">
              <div className="text-xs text-muted-foreground">
                {selectedEntry.employee.empCode} · {selectedEntry.employee.departmentName ?? '—'}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Earnings</p>
                <PayslipRow label="Basic Salary" value={selectedEntry.basicSalary} />
                <PayslipRow label="HRA" value={selectedEntry.hra} />
                <PayslipRow label="Special Allowance" value={selectedEntry.specialAllowance} />
                <PayslipRow label="Education Allowance" value={selectedEntry.educationAllowance} />
                <PayslipRow label="Travel Allowance" value={selectedEntry.travelAllowance} />
                <PayslipRow label="Other Allowances" value={selectedEntry.otherAllowances} />
                <PayslipRow label="Incentive" value={selectedEntry.incentiveAmount} />
                <PayslipRow label="Cumulative Incentive" value={selectedEntry.cumulativeIncentive} />
                <PayslipRow label="Overtime" value={selectedEntry.overtimeAmount} />
                <PayslipRow label="Bonus" value={selectedEntry.bonus} />
                <PayslipRow label="Green Thanks" value={selectedEntry.greenThanksAmount} />
                <PayslipRow label="Gross Salary" value={selectedEntry.grossSalary} bold />
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Deductions</p>
                <PayslipRow label={`PF Employee`} value={selectedEntry.pfEmployee} />
                <PayslipRow label="ESI Employee" value={selectedEntry.esiEmployee} />
                <PayslipRow label="Professional Tax" value={selectedEntry.professionalTax} />
                <PayslipRow label="TDS" value={selectedEntry.tds} />
                <PayslipRow label="Loan Deduction" value={selectedEntry.loanDeduction} />
                <PayslipRow label="Advance Deduction" value={selectedEntry.advanceDeduction} />
                <PayslipRow label="Other Deductions" value={selectedEntry.otherDeductions} />
              </div>

              <div className="space-y-2 border-t border-border pt-3">
                <PayslipRow label="LOP Days" value={selectedEntry.lopDays} isCurrency={false} />
                <PayslipRow label="Present Days" value={selectedEntry.presentDays} isCurrency={false} />
                <PayslipRow label="Working Days" value={selectedEntry.workingDays} isCurrency={false} />
                <PayslipRow label="Net Salary" value={selectedEntry.netSalary} bold />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="entry-remarks">Remarks</Label>
                <Textarea
                  id="entry-remarks"
                  placeholder="Ad-hoc remarks…"
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  disabled={!canEdit || isLocked}
                />
              </div>
            </div>
          )}
          <SheetFooter>
            <Button variant="outline" type="button" onClick={() => setSelectedEntry(null)}>Close</Button>
            {canEdit && !isLocked && (
              <Button onClick={() => updateEntry()} disabled={savingEntry}>
                {savingEntry && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Remarks
              </Button>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        title="Approve Payroll Run"
        description={`Approve the payroll run for ${run ? formatPeriod(run.month, run.year) : ''}? This will lock entries from further edits.`}
        confirmLabel={approving ? 'Approving…' : 'Approve'}
        onConfirm={() => approve()}
      />

      <ConfirmDialog
        open={disburseOpen}
        onOpenChange={setDisburseOpen}
        title="Disburse Payroll Run"
        description={`Mark the payroll run for ${run ? formatPeriod(run.month, run.year) : ''} as disbursed?`}
        confirmLabel={disbursing ? 'Disbursing…' : 'Disburse'}
        onConfirm={() => disburse()}
      />
    </div>
  )
}

function PayslipRow({
  label,
  value,
  bold,
  isCurrency = true,
}: {
  label: string
  value: number
  bold?: boolean
  isCurrency?: boolean
}) {
  return (
    <div className={`flex items-center justify-between text-sm ${bold ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
      <span>{label}</span>
      <span className={bold ? 'text-foreground' : ''}>{isCurrency ? formatCurrency(value) : Number(value).toFixed(2)}</span>
    </div>
  )
}
