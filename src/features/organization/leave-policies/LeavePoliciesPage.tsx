import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Resolver } from 'react-hook-form'
import { CalendarDays, Plus, Pencil, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { leavePoliciesApi } from '@/api/leave-policies.api'
import { LEAVE_TYPE_LABELS } from '@/lib/constants'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import type { LeavePolicy, LeaveType } from '@/types/organization.types'
import { toast } from 'sonner'

const LEAVE_TYPES: LeaveType[] = ['CASUAL', 'SICK', 'EARNED', 'LOSS_OF_PAY', 'MATERNITY', 'PATERNITY', 'COMPENSATORY']
const ACCRUAL_TYPES = ['monthly', 'quarterly', 'yearly', 'upfront']

const optionalInt = (min: number) =>
  z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number({ message: 'Must be a number' }).int().min(min).optional(),
  )

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  leaveType: z.string().min(1, 'Leave type is required'),
  daysPerYear: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number({ message: 'Days per year is required' }).min(0).max(365),
  ),
  carryForwardMax: optionalInt(0),
  minAdvanceDays: optionalInt(0),
  maxConsecutiveDays: optionalInt(1),
  accrualType: z.string().optional(),
  isEncashable: z.boolean().optional(),
  isLopEligible: z.boolean().optional(),
  allowedInProbation: z.boolean().optional(),
  isActive: z.boolean().optional(),
})
type FormValues = z.infer<typeof schema>

export function LeavePoliciesPage() {
  const qc = useQueryClient()
  const { page, limit } = usePagination()
  const canManage = usePermission('org:update')

  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<LeavePolicy | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['leave-policies', { page, limit }],
    queryFn: () => leavePoliciesApi.list({ page, limit }),
  })

  const policies: LeavePolicy[] = (data as { data?: LeavePolicy[] })?.data ?? []

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })

  const leaveTypeValue = watch('leaveType')
  const accrualValue = watch('accrualType')

  const openCreate = () => {
    reset({
      name: '',
      leaveType: 'CASUAL',
      daysPerYear: undefined,
      carryForwardMax: 0,
      minAdvanceDays: 0,
      maxConsecutiveDays: undefined,
      accrualType: 'monthly',
      isEncashable: false,
      isLopEligible: true,
      allowedInProbation: false,
      isActive: true,
    })
    setEditItem(null)
    setOpen(true)
  }

  const openEdit = (policy: LeavePolicy) => {
    reset({
      name: policy.name,
      leaveType: policy.leaveType,
      daysPerYear: policy.daysPerYear,
      carryForwardMax: policy.carryForwardMax ?? 0,
      minAdvanceDays: policy.minAdvanceDays ?? 0,
      maxConsecutiveDays: policy.maxConsecutiveDays ?? undefined,
      accrualType: policy.accrualType ?? 'monthly',
      isEncashable: policy.isEncashable,
      isLopEligible: policy.isLopEligible,
      allowedInProbation: policy.allowedInProbation,
      isActive: policy.isActive,
    })
    setEditItem(policy)
    setOpen(true)
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      const payload: Partial<LeavePolicy> = {
        name: values.name,
        leaveType: values.leaveType as LeaveType,
        daysPerYear: values.daysPerYear,
        carryForwardMax: values.carryForwardMax,
        minAdvanceDays: values.minAdvanceDays,
        maxConsecutiveDays: values.maxConsecutiveDays ?? null,
        accrualType: values.accrualType,
        isEncashable: values.isEncashable,
        isLopEligible: values.isLopEligible,
        allowedInProbation: values.allowedInProbation,
        isActive: values.isActive,
      }
      return editItem
        ? leavePoliciesApi.update(editItem.id, payload)
        : leavePoliciesApi.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leave-policies'] })
      setOpen(false)
      toast.success(editItem ? 'Leave policy updated.' : 'Leave policy created.')
    },
    onError: () => toast.error('Failed to save leave policy.'),
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Leave Policies</h1>
            <p className="text-sm text-muted-foreground">Manage leave types and rules</p>
          </div>
        </div>
        {canManage && (
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Policy
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {policies.map((policy) => (
            <Card key={policy.id} className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-semibold">{policy.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-[10px] bg-amber-100 text-amber-700 border-0">
                      {LEAVE_TYPE_LABELS[policy.leaveType] ?? policy.leaveType}
                    </Badge>
                    {canManage && (
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(policy)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div><span className="font-medium text-foreground">{policy.daysPerYear}</span> days/year</div>
                  <div><span className="font-medium text-foreground">{policy.carryForwardMax}</span> carry forward</div>
                  <div><span className="font-medium text-foreground">{policy.maxConsecutiveDays ?? '∞'}</span> max consecutive</div>
                  <div><span className="font-medium text-foreground">{policy.minAdvanceDays ?? 0}</span> min advance days</div>
                  <div>{policy.isEncashable ? '✓ Encashable' : '✗ Not encashable'}</div>
                  <div>{policy.isActive ? <span className="text-emerald-600">Active</span> : <span className="text-muted-foreground">Inactive</span>}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Leave Policy' : 'New Leave Policy'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => save(v))} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
            <div className="space-y-1.5">
              <Label htmlFor="lp-name">Name *</Label>
              <Input id="lp-name" placeholder="e.g. Annual Casual Leave" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Leave Type *</Label>
                <Select
                  items={Object.fromEntries(LEAVE_TYPES.map((t) => [t, LEAVE_TYPE_LABELS[t] ?? t]))}
                  value={leaveTypeValue ?? ''}
                  onValueChange={(v) => setValue('leaveType', v ?? '')}
                >
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{LEAVE_TYPE_LABELS[t] ?? t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.leaveType && <p className="text-xs text-destructive">{errors.leaveType.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Accrual</Label>
                <Select
                  items={Object.fromEntries(ACCRUAL_TYPES.map((a) => [a, a]))}
                  value={accrualValue ?? ''}
                  onValueChange={(v) => setValue('accrualType', v ?? '')}
                >
                  <SelectTrigger><SelectValue placeholder="Accrual" /></SelectTrigger>
                  <SelectContent>
                    {ACCRUAL_TYPES.map((a) => (
                      <SelectItem key={a} value={a}>{a}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="lp-days">Days / Year *</Label>
                <Input id="lp-days" type="number" step="any" placeholder="12" {...register('daysPerYear')} />
                {errors.daysPerYear && <p className="text-xs text-destructive">{errors.daysPerYear.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lp-carry">Carry Forward Max</Label>
                <Input id="lp-carry" type="number" placeholder="0" {...register('carryForwardMax')} />
                {errors.carryForwardMax && <p className="text-xs text-destructive">{errors.carryForwardMax.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="lp-min">Min Advance Days</Label>
                <Input id="lp-min" type="number" placeholder="0" {...register('minAdvanceDays')} />
                {errors.minAdvanceDays && <p className="text-xs text-destructive">{errors.minAdvanceDays.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lp-max">Max Consecutive Days</Label>
                <Input id="lp-max" type="number" placeholder="Unlimited" {...register('maxConsecutiveDays')} />
                {errors.maxConsecutiveDays && <p className="text-xs text-destructive">{errors.maxConsecutiveDays.message}</p>}
                <p className="text-[11px] text-muted-foreground">Blank = no per-application limit</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4" {...register('isEncashable')} />
                Encashable
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4" {...register('isLopEligible')} />
                LOP eligible
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4" {...register('allowedInProbation')} />
                Allowed in probation
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="h-4 w-4" {...register('isActive')} />
                Active
              </label>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editItem ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
