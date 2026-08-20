import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Target, Loader2, PlayCircle, StopCircle, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { performanceApi } from '@/api/performance.api'
import { employeesApi } from '@/api/employees.api'
import type { PerformanceRating } from '@/types/performance.types'
import type { Employee } from '@/types/employee.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-amber-100 text-amber-700',
}

const schema = z.object({
  employeeId: z.string().min(1, 'Required'),
  rating: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number().min(1, 'Must be 1-5').max(5, 'Must be 1-5')
  ),
  comments: z.string().optional(),
  isEligibleForIncrement: z.boolean(),
})
type FormValues = z.infer<typeof schema>

export function PerformanceCycleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const canApprove = usePermission('payroll:approve')
  const { page, limit, setPage } = usePagination()

  const [activateOpen, setActivateOpen] = useState(false)
  const [closeOpen, setCloseOpen] = useState(false)

  const { data: cycle, isLoading: cycleLoading } = useQuery({
    queryKey: ['performance-cycle', id],
    queryFn: () => performanceApi.getCycle(id as string),
    enabled: !!id,
  })

  const { data: ratingsData, isLoading: ratingsLoading } = useQuery({
    queryKey: ['performance-ratings', id, { page, limit }],
    queryFn: () => performanceApi.listRatings(id as string, { page, limit }),
    enabled: !!id,
  })

  const { data: employeesData } = useQuery({
    queryKey: ['employees', { forSelect: true }],
    queryFn: () => employeesApi.list({ limit: 100 }),
    enabled: !!id && cycle?.status === 'ACTIVE',
  })
  const employees = (employeesData as { data?: Employee[] })?.data ?? []

  const ratings = (ratingsData as { data?: PerformanceRating[] })?.data ?? []
  const ratingsMeta = (ratingsData as { meta?: PaginatedMeta })?.meta

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { isEligibleForIncrement: false },
  })
  const employeeId = watch('employeeId')
  const isEligibleForIncrement = watch('isEligibleForIncrement')

  const { mutate: submitRating, isPending: submitting } = useMutation({
    mutationFn: (values: FormValues) =>
      performanceApi.submitRating(id as string, {
        employeeId: values.employeeId,
        rating: values.rating,
        comments: values.comments,
        isEligibleForIncrement: values.isEligibleForIncrement,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['performance-ratings', id] })
      reset({ isEligibleForIncrement: false })
      toast.success('Rating submitted.')
    },
    onError: () => toast.error('Failed to submit rating. You can only rate your reporting-chain subordinates.'),
  })

  const { mutate: activate, isPending: activating } = useMutation({
    mutationFn: () => performanceApi.activateCycle(id as string),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['performance-cycle', id] })
      qc.invalidateQueries({ queryKey: ['performance-cycles'] })
      setActivateOpen(false)
      toast.success('Performance cycle activated.')
    },
    onError: () => toast.error('Failed to activate performance cycle.'),
  })

  const { mutate: close, isPending: closing } = useMutation({
    mutationFn: () => performanceApi.closeCycle(id as string),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['performance-cycle', id] })
      qc.invalidateQueries({ queryKey: ['performance-cycles'] })
      setCloseOpen(false)
      toast.success('Performance cycle closed.')
    },
    onError: () => toast.error('Failed to close performance cycle.'),
  })

  const ratingColumns: Column<PerformanceRating>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-foreground">
            {row.employee ? `${row.employee.firstName} ${row.employee.lastName}` : '—'}
          </p>
          <p className="text-xs text-muted-foreground">{row.employee?.empCode ?? ''}</p>
        </div>
      ),
    },
    {
      key: 'rater',
      header: 'Rated By',
      render: (row) => (row.rater ? `${row.rater.firstName} ${row.rater.lastName}` : '—'),
    },
    { key: 'rating', header: 'Rating', render: (row) => `${row.rating} / 5` },
    {
      key: 'isEligibleForIncrement',
      header: 'Increment Eligible',
      render: (row) => (row.isEligibleForIncrement ? 'Yes' : 'No'),
    },
    { key: 'comments', header: 'Comments', render: (row) => row.comments ?? '—' },
    { key: 'submittedAt', header: 'Submitted', render: (row) => formatDate(row.submittedAt) },
  ]

  if (cycleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (!cycle) {
    return (
      <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
        Performance cycle not found.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/performance')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Target className="h-5 w-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground">{cycle.name}</h1>
            <StatusBadge status={cycle.status} type="generic" colorClass={STATUS_COLORS[cycle.status]} />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatDate(cycle.startDate)} – {formatDate(cycle.endDate)}
            {cycle.closedAt ? ` · Closed ${formatDate(cycle.closedAt)}` : ''}
          </p>
        </div>
        {canApprove && cycle.status === 'DRAFT' && (
          <Button size="sm" variant="outline" onClick={() => setActivateOpen(true)}>
            <PlayCircle className="h-3.5 w-3.5 mr-1" />
            Activate
          </Button>
        )}
        {canApprove && cycle.status === 'ACTIVE' && (
          <Button size="sm" variant="outline" className="text-destructive hover:text-destructive" onClick={() => setCloseOpen(true)}>
            <StopCircle className="h-3.5 w-3.5 mr-1" />
            Close
          </Button>
        )}
      </div>

      {cycle.status === 'CLOSED' && (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          <Lock className="h-4 w-4" />
          This cycle is closed and locked. Ratings are read-only.
        </div>
      )}

      {cycle.status === 'ACTIVE' && (
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Rate a Report</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit((v) => submitRating(v))} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Employee *</Label>
                  <Select
                    items={Object.fromEntries(employees.map((e) => [e.id, `${e.firstName} ${e.lastName} (${e.empCode})`]))}
                    value={employeeId ?? ''}
                    onValueChange={(v) => setValue('employeeId', v ?? '')}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select employee" /></SelectTrigger>
                    <SelectContent>
                      {employees.map((e) => (
                        <SelectItem key={e.id} value={e.id}>
                          {e.firstName} {e.lastName} ({e.empCode})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.employeeId && <p className="text-xs text-destructive">{errors.employeeId.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="rating">Rating (1-5) *</Label>
                  <Input id="rating" type="number" min="1" max="5" step="0.5" {...register('rating')} />
                  {errors.rating && <p className="text-xs text-destructive">{errors.rating.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="comments">Comments</Label>
                <Textarea id="comments" placeholder="Optional feedback" {...register('comments')} />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="isEligibleForIncrement"
                  checked={isEligibleForIncrement ?? false}
                  onCheckedChange={(checked) => setValue('isEligibleForIncrement', checked === true)}
                />
                <Label htmlFor="isEligibleForIncrement" className="cursor-pointer">Eligible for increment</Label>
              </div>
              <p className="text-xs text-muted-foreground">
                You can only rate employees in your own reporting chain. The backend enforces this.
              </p>
              <div className="flex justify-end">
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Submit Rating
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <DataTable
        columns={ratingColumns}
        data={ratings}
        isLoading={ratingsLoading}
        pagination={ratingsMeta}
        onPageChange={setPage}
        rowKey={(r) => r.id}
        emptyMessage="No ratings submitted for this cycle yet."
      />

      <ConfirmDialog
        open={activateOpen}
        onOpenChange={setActivateOpen}
        title="Activate Performance Cycle"
        description={`Activate "${cycle.name}"? Managers will be able to submit ratings once active.`}
        confirmLabel={activating ? 'Activating…' : 'Activate'}
        onConfirm={() => activate()}
      />

      <ConfirmDialog
        open={closeOpen}
        onOpenChange={setCloseOpen}
        title="Close Performance Cycle"
        description={`Close "${cycle.name}"? This locks the cycle and no further ratings can be submitted or edited.`}
        confirmLabel={closing ? 'Closing…' : 'Close'}
        variant="destructive"
        onConfirm={() => close()}
      />
    </div>
  )
}
