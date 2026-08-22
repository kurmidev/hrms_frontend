import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Resolver } from 'react-hook-form'
import { CalendarDays, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { leaveApi } from '@/api/leave.api'
import type { LeaveApplication, LeaveBalance } from '@/types/leave.types'
import { LEAVE_TYPE_LABELS } from '@/lib/constants'
import { formatDate, getApiErrorMessage } from '@/lib/utils'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { toast } from 'sonner'

const schema = z
  .object({
    leavePolicyTypeId: z.string().min(1, 'Leave type is required'),
    fromDate: z.string().min(1, 'From date is required'),
    toDate: z.string().min(1, 'To date is required'),
    days: z.preprocess(
      (v) => (v === '' ? undefined : Number(v)),
      z.number().min(0.5, 'Days must be at least 0.5')
    ),
    reason: z.string().min(1, 'Reason is required'),
  })
  .refine((v) => !v.fromDate || !v.toDate || v.toDate >= v.fromDate, {
    message: 'To date must be on or after the from date',
    path: ['toDate'],
  })
type FormValues = z.infer<typeof schema>

// Inclusive calendar-day count between two yyyy-mm-dd date strings.
function calculateLeaveDays(fromDate: string, toDate: string): number | undefined {
  if (!fromDate || !toDate) return undefined
  const from = new Date(fromDate)
  const to = new Date(toDate)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return undefined
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY) + 1
}

export function LeavePage() {
  const qc = useQueryClient()
  const { page, limit, setPage } = usePagination()
  const [open, setOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<LeaveApplication | null>(null)
  // The whole page (balance, my applications, apply, cancel) is backed by
  // endpoints that require `leave:apply` server-side (see leave.controller.ts:
  // GET /leave/my-balance, GET /leave/my, POST /leave/apply, PUT /leave/:id/cancel).
  // A user reachable here via the sidebar's child-permission fallback (rule
  // #15) may hold `leave:read` but not `leave:apply` — self-gate so we never
  // fire requests that user can't make and never render an Apply button that
  // will 403.
  const canApply = usePermission('leave:apply')

  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ['my-leave-balance'],
    queryFn: () => leaveApi.getMyBalance(),
    enabled: canApply,
  })

  const { data, isLoading } = useQuery({
    queryKey: ['my-leave-applications', { page, limit }],
    queryFn: () => leaveApi.myList({ page, limit }),
    enabled: canApply,
  })

  const applications: LeaveApplication[] = (data as { data?: LeaveApplication[] })?.data ?? []
  const meta = (data as { meta?: { total: number; page: number; limit: number; totalPages: number } })?.meta
  const balanceList: LeaveBalance[] = balances ?? []

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })
  const selectedPolicyTypeId = watch('leavePolicyTypeId')
  const watchedFromDate = watch('fromDate')
  const watchedToDate = watch('toDate')

  useEffect(() => {
    const computed = calculateLeaveDays(watchedFromDate, watchedToDate)
    setValue('days', computed as number, { shouldValidate: true })
  }, [watchedFromDate, watchedToDate, setValue])

  const openApply = () => {
    reset({ leavePolicyTypeId: '', fromDate: '', toDate: '', days: undefined, reason: '' })
    setOpen(true)
  }

  const { mutate: apply, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      leaveApi.apply({
        leavePolicyTypeId: values.leavePolicyTypeId,
        fromDate: values.fromDate,
        toDate: values.toDate,
        days: values.days,
        reason: values.reason,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-leave-applications'] })
      qc.invalidateQueries({ queryKey: ['my-leave-balance'] })
      setOpen(false)
      toast.success('Leave application submitted.')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to submit leave application.')),
  })

  const { mutate: cancel, isPending: cancelling } = useMutation({
    mutationFn: (id: string) => leaveApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-leave-applications'] })
      qc.invalidateQueries({ queryKey: ['my-leave-balance'] })
      setCancelTarget(null)
      toast.success('Leave application cancelled.')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to cancel leave application.')),
  })

  const columns: Column<LeaveApplication>[] = [
    {
      key: 'leavePolicyType',
      header: 'Leave Type',
      render: (row) => row.leavePolicyType?.name ?? LEAVE_TYPE_LABELS[row.leavePolicyType?.leaveType ?? ''] ?? '—',
    },
    { key: 'fromDate', header: 'From', render: (row) => formatDate(row.fromDate) },
    { key: 'toDate', header: 'To', render: (row) => formatDate(row.toDate) },
    { key: 'days', header: 'Days' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} type="leave" /> },
    {
      key: 'actions',
      header: '',
      render: (row) =>
        row.status === 'PENDING' ? (
          <Button variant="outline" size="sm" onClick={() => setCancelTarget(row)}>
            Cancel
          </Button>
        ) : null,
    },
  ]

  if (!canApply) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Leave</h1>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          You do not have permission to apply for leave.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Leave</h1>
            <p className="text-sm text-muted-foreground">View balances and apply for leave</p>
          </div>
        </div>
        <Button onClick={openApply} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Apply Leave
        </Button>
      </div>

      {balancesLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {balanceList.map((b) => (
            <Card key={b.id} className="shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  {b.leavePolicyType?.name ?? LEAVE_TYPE_LABELS[b.leavePolicyType?.leaveType ?? ''] ?? 'Leave'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {b.balanceDays}
                  <span className="text-sm font-normal text-muted-foreground"> / {b.entitledDays} days</span>
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <DataTable
        columns={columns}
        data={applications}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        rowKey={(r) => r.id}
        emptyMessage="No leave applications found."
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Apply for Leave</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit((v) => apply(v))} className="flex flex-col gap-4 px-4 flex-1 overflow-y-auto">
            <div className="space-y-1.5">
              <Label htmlFor="leavePolicyTypeId">Leave Type *</Label>
              <Select
                items={Object.fromEntries(
                  balanceList
                    .filter((b) => b.leavePolicyType)
                    .map((b) => [
                      b.leavePolicyType!.id,
                      `${b.leavePolicyType!.name ?? LEAVE_TYPE_LABELS[b.leavePolicyType!.leaveType] ?? b.leavePolicyType!.leaveType} (${b.balanceDays} left)`,
                    ]),
                )}
                value={selectedPolicyTypeId ?? ''}
                onValueChange={(v) => setValue('leavePolicyTypeId', v ?? '')}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select leave type" /></SelectTrigger>
                <SelectContent>
                  {balanceList.filter((b) => b.leavePolicyType).map((b) => (
                    <SelectItem key={b.leavePolicyType!.id} value={b.leavePolicyType!.id}>
                      {b.leavePolicyType!.name ?? LEAVE_TYPE_LABELS[b.leavePolicyType!.leaveType] ?? b.leavePolicyType!.leaveType} ({b.balanceDays} left)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.leavePolicyTypeId && <p className="text-xs text-destructive">{errors.leavePolicyTypeId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fromDate">From Date *</Label>
              <Input id="fromDate" type="date" {...register('fromDate')} />
              {errors.fromDate && <p className="text-xs text-destructive">{errors.fromDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="toDate">To Date *</Label>
              <Input id="toDate" type="date" {...register('toDate')} />
              {errors.toDate && <p className="text-xs text-destructive">{errors.toDate.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="days">Days *</Label>
              <Input
                id="days"
                type="number"
                readOnly
                className="bg-muted/50 cursor-not-allowed"
                {...register('days')}
              />
              <p className="text-xs text-muted-foreground">Calculated automatically from the selected dates.</p>
              {errors.days && <p className="text-xs text-destructive">{errors.days.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason *</Label>
              <Textarea id="reason" placeholder="Reason for leave…" {...register('reason')} />
              {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
            </div>
            <SheetFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Submit
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(o) => !o && setCancelTarget(null)}
        title="Cancel Leave Application"
        description={`Cancel your leave application from ${cancelTarget ? formatDate(cancelTarget.fromDate) : ''} to ${cancelTarget ? formatDate(cancelTarget.toDate) : ''}?`}
        confirmLabel={cancelling ? 'Cancelling…' : 'Cancel Application'}
        onConfirm={() => cancelTarget && cancel(cancelTarget.id)}
        variant="destructive"
      />
    </div>
  )
}
