import { useState } from 'react'
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
import type { LeaveApplication, LeaveBalance, LeavePolicy } from '@/types/leave.types'
import { LEAVE_TYPE_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { usePagination } from '@/hooks/usePagination'
import { toast } from 'sonner'

const schema = z.object({
  leavePolicyId: z.string().min(1, 'Leave type is required'),
  fromDate: z.string().min(1, 'From date is required'),
  toDate: z.string().min(1, 'To date is required'),
  days: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number().min(0.5, 'Days must be at least 0.5')
  ),
  reason: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function LeavePage() {
  const qc = useQueryClient()
  const { page, limit, setPage } = usePagination()
  const [open, setOpen] = useState(false)
  const [cancelTarget, setCancelTarget] = useState<LeaveApplication | null>(null)

  const { data: balances, isLoading: balancesLoading } = useQuery({
    queryKey: ['my-leave-balance'],
    queryFn: () => leaveApi.getMyBalance(),
  })

  const { data: policiesData } = useQuery({
    queryKey: ['leave-policies-active'],
    queryFn: () => leaveApi.getPolicies(),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['my-leave-applications', { page, limit }],
    queryFn: () => leaveApi.myList({ page, limit }),
  })

  const applications: LeaveApplication[] = (data as { data?: LeaveApplication[] })?.data ?? []
  const meta = (data as { meta?: { total: number; page: number; limit: number; totalPages: number } })?.meta
  const policies: LeavePolicy[] = Array.isArray(policiesData) ? policiesData : (policiesData as { data?: LeavePolicy[] })?.data ?? []
  const balanceList: LeaveBalance[] = balances ?? []

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })
  const selectedPolicyId = watch('leavePolicyId')

  const openApply = () => {
    reset({ leavePolicyId: '', fromDate: '', toDate: '', days: undefined, reason: '' })
    setOpen(true)
  }

  const { mutate: apply, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      leaveApi.apply({
        leavePolicyId: values.leavePolicyId,
        fromDate: values.fromDate,
        toDate: values.toDate,
        days: values.days,
        reason: values.reason || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-leave-applications'] })
      qc.invalidateQueries({ queryKey: ['my-leave-balance'] })
      setOpen(false)
      toast.success('Leave application submitted.')
    },
    onError: () => toast.error('Failed to submit leave application.'),
  })

  const { mutate: cancel, isPending: cancelling } = useMutation({
    mutationFn: (id: string) => leaveApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-leave-applications'] })
      qc.invalidateQueries({ queryKey: ['my-leave-balance'] })
      setCancelTarget(null)
      toast.success('Leave application cancelled.')
    },
    onError: () => toast.error('Failed to cancel leave application.'),
  })

  const columns: Column<LeaveApplication>[] = [
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
      header: '',
      render: (row) =>
        row.status === 'PENDING' ? (
          <Button variant="outline" size="sm" onClick={() => setCancelTarget(row)}>
            Cancel
          </Button>
        ) : null,
    },
  ]

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
                  {b.leavePolicy?.name ?? LEAVE_TYPE_LABELS[b.leavePolicy?.leaveType ?? ''] ?? 'Leave'}
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
              <Label htmlFor="leavePolicyId">Leave Type *</Label>
              <Select
                value={selectedPolicyId ?? ''}
                onValueChange={(v) => setValue('leavePolicyId', v ?? '')}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select leave type" /></SelectTrigger>
                <SelectContent>
                  {policies.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.leavePolicyId && <p className="text-xs text-destructive">{errors.leavePolicyId.message}</p>}
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
              <Input id="days" type="number" step="0.5" min="0.5" {...register('days')} />
              {errors.days && <p className="text-xs text-destructive">{errors.days.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" placeholder="Reason for leave…" {...register('reason')} />
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
