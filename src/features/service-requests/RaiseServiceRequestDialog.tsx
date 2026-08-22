import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Resolver } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { serviceRequestApi } from '@/api/service-request.api'
import { employeesApi } from '@/api/employees.api'
import { apiClient, unwrap } from '@/api/client'
import type { ServiceRequestCategory, ServiceRequestPriority } from '@/types/service-request.types'
import type { Employee } from '@/types/employee.types'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'
import { SERVICE_REQUEST_CATEGORY_LABELS } from '@/lib/constants'
import { useAuthStore } from '@/store/auth.store'

const CATEGORIES: ServiceRequestCategory[] = [
  'HR', 'IT', 'ADMIN', 'COMPLIANCE', 'FINANCE', 'POLICY_CLARIFICATION', 'SPECIAL_LEAVE',
]
const PRIORITIES: ServiceRequestPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

// Inclusive calendar-day count between two yyyy-mm-dd date strings. Mirrors
// LeavePage.tsx's calculateLeaveDays — replicated locally rather than
// imported to avoid coupling this feature to the leave feature slice.
function calculateLeaveDays(fromDate: string, toDate: string): number | undefined {
  if (!fromDate || !toDate) return undefined
  const from = new Date(fromDate)
  const to = new Date(toDate)
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to < from) return undefined
  const MS_PER_DAY = 24 * 60 * 60 * 1000
  return Math.round((to.getTime() - from.getTime()) / MS_PER_DAY) + 1
}

interface LeavePolicyTypeOption {
  id: string
  name: string
  leaveType: string
  daysPerYear: number
}

interface LeavePolicyBundle {
  id: string
  name: string
  types: LeavePolicyTypeOption[]
}

const schema = z
  .object({
    category: z.enum(['HR', 'IT', 'ADMIN', 'COMPLIANCE', 'FINANCE', 'POLICY_CLARIFICATION', 'SPECIAL_LEAVE']),
    title: z.string().min(1, 'Required'),
    description: z.string().min(1, 'Required'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    isAnonymous: z.boolean().optional(),
    employeeId: z.string().optional(),
    leavePolicyTypeId: z.string().optional(),
    leaveFromDate: z.string().optional(),
    leaveToDate: z.string().optional(),
    leaveDays: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().optional()),
  })
  .superRefine((v, ctx) => {
    if (v.category !== 'SPECIAL_LEAVE') return
    if (!v.employeeId) ctx.addIssue({ code: 'custom', message: 'Employee is required', path: ['employeeId'] })
    if (!v.leavePolicyTypeId) ctx.addIssue({ code: 'custom', message: 'Leave type is required', path: ['leavePolicyTypeId'] })
    if (!v.leaveFromDate) ctx.addIssue({ code: 'custom', message: 'From date is required', path: ['leaveFromDate'] })
    if (!v.leaveToDate) ctx.addIssue({ code: 'custom', message: 'To date is required', path: ['leaveToDate'] })
    if (v.leaveFromDate && v.leaveToDate && v.leaveToDate < v.leaveFromDate) {
      ctx.addIssue({ code: 'custom', message: 'To date must be on or after from date', path: ['leaveToDate'] })
    }
    if (!v.leaveDays || v.leaveDays < 0.5) {
      ctx.addIssue({ code: 'custom', message: 'Days must be at least 0.5', path: ['leaveDays'] })
    }
  })
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RaiseServiceRequestDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient()
  const currentEmployeeId = useAuthStore((s) => s.user?.employee?.id) ?? null

  // Anonymous submission is an org-level toggle (Organization.allowAnonymousServiceRequests) —
  // the checkbox must only render when the org actually allows it, otherwise the backend
  // rejects the create with a 400 the user has no way to anticipate. Uses the
  // service-requests-scoped settings endpoint (not /organization, which requires org:read —
  // a permission regular requesters don't hold).
  const { data: settings } = useQuery({
    queryKey: ['service-request-settings'],
    queryFn: serviceRequestApi.settings,
    staleTime: 5 * 60 * 1000,
  })
  const allowAnonymous = settings?.allowAnonymousServiceRequests ?? false

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { category: 'HR', priority: 'MEDIUM', isAnonymous: false },
  })
  const category = watch('category')
  const isSpecialLeave = category === 'SPECIAL_LEAVE'
  const watchedFromDate = watch('leaveFromDate')
  const watchedToDate = watch('leaveToDate')

  useEffect(() => {
    if (!isSpecialLeave) return
    const computed = calculateLeaveDays(watchedFromDate ?? '', watchedToDate ?? '')
    setValue('leaveDays', computed, { shouldValidate: true })
  }, [isSpecialLeave, watchedFromDate, watchedToDate, setValue])

  // Direct reports only — the backend enforces reportingManagerId on the special-leave
  // create, so any other employee selection would 403/400 server-side anyway.
  const { data: reportsData } = useQuery({
    queryKey: ['employees', currentEmployeeId, 'subordinates', 1],
    queryFn: () => employeesApi.subordinates(currentEmployeeId as string, 1),
    enabled: open && isSpecialLeave && !!currentEmployeeId,
  })
  const directReports = (reportsData as Employee[] | { data?: Employee[] } | undefined)
  const reports: Employee[] = Array.isArray(directReports) ? directReports : directReports?.data ?? []

  // Flattened across all leave policy bundles — a simpler fallback than scoping to the
  // selected employee's specific assigned policy, since that mapping isn't readily
  // available from the employee-picker's own response.
  const { data: policiesData } = useQuery({
    queryKey: ['leave-policies', { forSelect: true }],
    queryFn: () => apiClient.get('/leave-policies', { params: { limit: 100 } }).then(unwrap),
    enabled: open && isSpecialLeave,
  })
  const policyBundles = (policiesData as { data?: LeavePolicyBundle[] })?.data ?? []
  const leaveTypeOptions = policyBundles.flatMap((p) => p.types ?? [])

  const { mutate: create, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      serviceRequestApi.create({
        category: values.category,
        title: values.title,
        description: values.description,
        priority: values.priority,
        isAnonymous: values.category === 'SPECIAL_LEAVE' ? false : values.isAnonymous,
        ...(values.category === 'SPECIAL_LEAVE'
          ? {
              employeeId: values.employeeId,
              leavePolicyTypeId: values.leavePolicyTypeId,
              leaveFromDate: values.leaveFromDate,
              leaveToDate: values.leaveToDate,
              leaveDays: values.leaveDays,
            }
          : {}),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-requests'] })
      onOpenChange(false)
      reset()
      toast.success('Request submitted.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to submit request.')),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="w-[92vw] sm:w-[85vw] lg:w-[70vw] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Raise a Service Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => create(v))} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    items={Object.fromEntries(CATEGORIES.map((c) => [c, SERVICE_REQUEST_CATEGORY_LABELS[c] ?? c]))}
                    value={field.value}
                    onValueChange={(v) => field.onChange(v ?? '')}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{SERVICE_REQUEST_CATEGORY_LABELS[c] ?? c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select
                    items={Object.fromEntries(PRIORITIES.map((p) => [p, p]))}
                    value={field.value ?? ''}
                    onValueChange={(v) => field.onChange(v ?? '')}
                  >
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" placeholder="Short summary" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" placeholder="Describe your request…" {...register('description')} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>

          {isSpecialLeave && (
            <div className="space-y-4 rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">Special Leave Details</p>
              <div className="space-y-1.5">
                <Label>Employee *</Label>
                <Controller
                  name="employeeId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      items={Object.fromEntries(reports.map((e) => [e.id, `${e.firstName} ${e.lastName} (${e.empCode})`]))}
                      value={field.value ?? ''}
                      onValueChange={(v) => field.onChange(v ?? '')}
                    >
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select a direct report" /></SelectTrigger>
                      <SelectContent>
                        {reports.length === 0 && (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">No direct reports found.</div>
                        )}
                        {reports.map((e) => (
                          <SelectItem key={e.id} value={e.id}>
                            {e.firstName} {e.lastName} ({e.empCode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.employeeId && <p className="text-xs text-destructive">{errors.employeeId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Leave Type *</Label>
                <Controller
                  name="leavePolicyTypeId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      items={Object.fromEntries(leaveTypeOptions.map((t) => [t.id, t.name]))}
                      value={field.value ?? ''}
                      onValueChange={(v) => field.onChange(v ?? '')}
                    >
                      <SelectTrigger className="w-full"><SelectValue placeholder="Select leave type" /></SelectTrigger>
                      <SelectContent>
                        {leaveTypeOptions.map((t) => (
                          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.leavePolicyTypeId && <p className="text-xs text-destructive">{errors.leavePolicyTypeId.message}</p>}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="leaveFromDate">From Date *</Label>
                  <Input id="leaveFromDate" type="date" {...register('leaveFromDate')} />
                  {errors.leaveFromDate && <p className="text-xs text-destructive">{errors.leaveFromDate.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="leaveToDate">To Date *</Label>
                  <Input id="leaveToDate" type="date" {...register('leaveToDate')} />
                  {errors.leaveToDate && <p className="text-xs text-destructive">{errors.leaveToDate.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="leaveDays">Days *</Label>
                  <Input id="leaveDays" type="number" step="0.5" min={0.5} readOnly {...register('leaveDays')} />
                  {errors.leaveDays && <p className="text-xs text-destructive">{errors.leaveDays.message}</p>}
                </div>
              </div>
            </div>
          )}

          {allowAnonymous && !isSpecialLeave && (
            <div className="flex items-center gap-2">
              <Controller
                name="isAnonymous"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="isAnonymous"
                    checked={!!field.value}
                    onCheckedChange={(v) => field.onChange(!!v)}
                  />
                )}
              />
              <Label htmlFor="isAnonymous" className="text-sm font-normal cursor-pointer">
                Submit anonymously
              </Label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
