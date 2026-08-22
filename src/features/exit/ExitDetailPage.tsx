import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, DoorOpen, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { exitApi } from '@/api/exit.api'
import { employeesApi } from '@/api/employees.api'
import type { ExitDepartmentClearance, ExitSettlementSummary } from '@/types/exit.types'
import { usePermission } from '@/hooks/usePermission'
import { formatCurrency, formatDate, getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  INITIATED: 'bg-secondary text-secondary-foreground',
  CLEARANCE_PENDING: 'bg-accent-orange/10 text-accent-orange',
  CLEARED: 'bg-accent-green/10 text-accent-green',
  SETTLED: 'bg-accent-green/10 text-accent-green',
  COMPLETED: 'bg-accent-green/10 text-accent-green',
}

export function ExitDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const canManage = usePermission('exit:manage')

  const [localDepartments, setLocalDepartments] = useState<ExitDepartmentClearance[]>([])
  const [kt, setKt] = useState(false)
  const [settlementAmount, setSettlementAmount] = useState('')
  const [settlementSummary, setSettlementSummary] = useState<ExitSettlementSummary | null>(null)

  const { data: exit, isLoading } = useQuery({
    queryKey: ['exit', id],
    queryFn: () => exitApi.get(id as string),
    enabled: !!id && canManage,
  })

  const { data: employee } = useQuery({
    queryKey: ['employee', exit?.employeeId],
    queryFn: () => employeesApi.get(exit?.employeeId as string),
    enabled: !!exit?.employeeId,
  })

  useEffect(() => {
    if (exit) {
      setLocalDepartments(exit.clearanceStatus.departments)
      setKt(exit.knowledgeTransferComplete)
    }
  }, [exit])

  const { mutate: saveClearance, isPending: savingClearance } = useMutation({
    mutationFn: (advanceToClearedIfComplete: boolean) => {
      if (!id) return Promise.reject(new Error('No exit id'))
      return exitApi.updateClearance(id, {
        departments: localDepartments.map((d) => ({ department: d.department, cleared: d.cleared, clearedBy: d.clearedBy ?? undefined })),
        knowledgeTransferComplete: kt,
        advanceToClearedIfComplete,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exit'] })
      toast.success('Clearance updated.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to update clearance.')),
  })

  const { mutate: settle, isPending: settling } = useMutation({
    mutationFn: () => {
      if (!id) return Promise.reject(new Error('No exit id'))
      const amount = Number(settlementAmount)
      return exitApi.settle(id, { settlementAmount: amount })
    },
    onSuccess: (summary) => {
      setSettlementSummary(summary)
      qc.invalidateQueries({ queryKey: ['exit'] })
      toast.success('Settlement processed. Employee marked as exited.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to process settlement.')),
  })

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <XCircle className="h-10 w-10 text-muted-foreground mb-3" />
        <p className="text-sm font-medium text-foreground">You don't have access to this page.</p>
      </div>
    )
  }

  const allDepartmentsCleared = localDepartments.length > 0 && localDepartments.every((d) => d.cleared)
  const assetHandoverCleared = (exit?.clearanceStatus.assetHandover.unreturnedCount ?? 1) === 0
  const canCompleteClearance = allDepartmentsCleared && assetHandoverCleared && kt
    && exit?.status !== 'CLEARED' && exit?.status !== 'SETTLED' && exit?.status !== 'COMPLETED'

  const toggleDepartment = (department: string) => {
    setLocalDepartments((prev) =>
      prev.map((d) => (d.department === department ? { ...d, cleared: !d.cleared } : d))
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/exit')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <DoorOpen className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          {isLoading ? (
            <Skeleton className="h-6 w-40" />
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">
                {employee ? `${employee.firstName} ${employee.lastName}` : 'Exit Record'}
              </h1>
              {exit && (
                <Badge className={`border-0 text-xs font-medium ${STATUS_COLORS[exit.status]}`} variant="secondary">
                  {exit.status.replace('_', ' ')}
                </Badge>
              )}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {exit ? `${exit.type} · Initiated by ${exit.initiatedBy}` : ''}
          </p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 rounded-xl" />
      ) : exit ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-muted-foreground">Initiated</CardTitle></CardHeader>
              <CardContent><p className="text-sm font-medium text-foreground">{formatDate(exit.initiatedAt)}</p></CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-muted-foreground">Last Working Date</CardTitle></CardHeader>
              <CardContent><p className="text-sm font-medium text-foreground">{exit.lastWorkingDate ? formatDate(exit.lastWorkingDate) : '—'}</p></CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-muted-foreground">Target Settlement Date</CardTitle></CardHeader>
              <CardContent><p className="text-sm font-medium text-foreground">{exit.targetSettlementDate ? formatDate(exit.targetSettlementDate) : '—'}</p></CardContent>
            </Card>
            <Card className="shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-muted-foreground">NOC Issued</CardTitle></CardHeader>
              <CardContent><p className="text-sm font-medium text-foreground">{exit.nocIssuedAt ? formatDate(exit.nocIssuedAt) : '—'}</p></CardContent>
            </Card>
          </div>

          <Card className="shadow-sm">
            <CardContent className="pt-6 text-sm">
              <p><span className="font-medium text-foreground">Reason: </span><span className="text-muted-foreground">{exit.reason}</span></p>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Clearance Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Department NOCs</p>
                {localDepartments.map((d) => (
                  <label key={d.department} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={d.cleared}
                      onCheckedChange={() => toggleDepartment(d.department)}
                      disabled={!canManage}
                    />
                    <span className="text-sm text-foreground">{d.department}</span>
                    {d.cleared && <CheckCircle2 className="h-3.5 w-3.5 text-accent-green" />}
                  </label>
                ))}
                {localDepartments.length === 0 && (
                  <p className="text-sm text-muted-foreground">No departments configured.</p>
                )}
              </div>

              <div className="flex items-center justify-between rounded-md border border-border p-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Asset Handover</p>
                  <p className="text-xs text-muted-foreground">
                    {exit.clearanceStatus.assetHandover.unreturnedCount} unreturned asset(s)
                  </p>
                </div>
                <Badge
                  className={`border-0 text-xs font-medium ${assetHandoverCleared ? 'bg-accent-green/10 text-accent-green' : 'bg-accent-red/10 text-accent-red'}`}
                  variant="secondary"
                >
                  {assetHandoverCleared ? 'Cleared' : 'Pending'}
                </Badge>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={kt} onCheckedChange={(c) => setKt(c === true)} disabled={!canManage} />
                <span className="text-sm text-foreground">Knowledge Transfer Complete</span>
              </label>

              {canManage && (
                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={savingClearance}
                    onClick={() => saveClearance(false)}
                  >
                    {savingClearance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Clearance
                  </Button>
                  <Button
                    size="sm"
                    disabled={!canCompleteClearance || savingClearance}
                    onClick={() => saveClearance(true)}
                  >
                    {savingClearance && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Complete Clearance
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Settlement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {exit.settledAt ? (
                <div className="space-y-1 text-sm">
                  <p><span className="font-medium text-foreground">Settlement Amount: </span>{formatCurrency(exit.settlementAmount)}</p>
                  <p><span className="font-medium text-foreground">Settled At: </span>{formatDate(exit.settledAt)}</p>
                </div>
              ) : (
                <>
                  {settlementSummary && (
                    <div className="rounded-md border border-border bg-muted/30 p-3 text-sm space-y-1">
                      <p><span className="font-medium text-foreground">Outstanding Loan Balance: </span>{formatCurrency(settlementSummary.outstandingLoanBalance)}</p>
                      <p><span className="font-medium text-foreground">Unreturned Assets: </span>{settlementSummary.unreturnedAssetCount}</p>
                      <p><span className="font-medium text-foreground">Settlement Amount: </span>{formatCurrency(settlementSummary.settlementAmount)}</p>
                    </div>
                  )}
                  {canManage && (
                    <div className="flex items-end gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="settlementAmount">Settlement Amount</Label>
                        <Input
                          id="settlementAmount"
                          type="number"
                          min="0"
                          step="0.01"
                          value={settlementAmount}
                          onChange={(e) => setSettlementAmount(e.target.value)}
                          disabled={exit.status !== 'CLEARED'}
                          className="w-48"
                        />
                      </div>
                      <Button
                        disabled={exit.status !== 'CLEARED' || settling || !settlementAmount}
                        onClick={() => settle()}
                      >
                        {settling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Process Settlement
                      </Button>
                    </div>
                  )}
                  {exit.status !== 'CLEARED' && (
                    <p className="text-xs text-muted-foreground">
                      Settlement is only available once clearance is complete.
                    </p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  )
}
