import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CalendarDays, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
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
import { getApiErrorMessage } from '@/lib/utils'

const LEAVE_TYPES: LeaveType[] = ['CASUAL', 'SICK', 'EARNED', 'LOSS_OF_PAY', 'MATERNITY', 'PATERNITY', 'COMPENSATORY']
const ACCRUAL_TYPES = ['monthly', 'quarterly', 'yearly', 'upfront']

const optionalInt = (min: number) =>
  z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? undefined : Number(v)),
    z.number({ message: 'Must be a number' }).int().min(min).optional(),
  )

const typeSchema = z.object({
  id: z.string().optional(),
  leaveType: z.string().min(1, 'Leave type is required'),
  name: z.string().optional(),
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
})

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  isActive: z.boolean().optional(),
  types: z.array(typeSchema).min(1, 'Add at least one leave type'),
})
type FormValues = z.infer<typeof schema>

const emptyType = {
  leaveType: 'CASUAL',
  name: '',
  daysPerYear: 0,
  carryForwardMax: 0,
  minAdvanceDays: 0,
  maxConsecutiveDays: undefined,
  accrualType: 'monthly',
  isEncashable: false,
  isLopEligible: true,
  allowedInProbation: false,
}

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

  const { register, control, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'types' })

  const openCreate = () => {
    reset({ name: '', isActive: true, types: [{ ...emptyType }] })
    setEditItem(null)
    setOpen(true)
  }

  const openEdit = (policy: LeavePolicy) => {
    reset({
      name: policy.name,
      isActive: policy.isActive,
      types: policy.types.map((t) => ({
        id: t.id,
        leaveType: t.leaveType,
        name: t.name ?? '',
        daysPerYear: t.daysPerYear,
        carryForwardMax: t.carryForwardMax ?? 0,
        minAdvanceDays: t.minAdvanceDays ?? 0,
        maxConsecutiveDays: t.maxConsecutiveDays ?? undefined,
        accrualType: t.accrualType ?? 'monthly',
        isEncashable: t.isEncashable ?? false,
        isLopEligible: t.isLopEligible ?? true,
        allowedInProbation: t.allowedInProbation ?? false,
      })),
    })
    setEditItem(policy)
    setOpen(true)
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        name: values.name,
        isActive: values.isActive,
        types: values.types.map((t) => ({
          ...(t.id ? { id: t.id } : {}),
          leaveType: t.leaveType as LeaveType,
          name: t.name || undefined,
          daysPerYear: t.daysPerYear,
          carryForwardMax: t.carryForwardMax,
          minAdvanceDays: t.minAdvanceDays,
          maxConsecutiveDays: t.maxConsecutiveDays ?? undefined,
          accrualType: t.accrualType,
          isEncashable: t.isEncashable,
          isLopEligible: t.isLopEligible,
          allowedInProbation: t.allowedInProbation,
        })),
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
    // Backend 400s naming the blocking type when a `types` entry is removed
    // from an update but still referenced by existing balances/applications
    // — surface that message verbatim via toast rather than a generic one.
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to save leave policy.')),
  })

  const isActive = watch('isActive')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Leave Policies</h1>
            <p className="text-sm text-muted-foreground">Manage leave policy bundles and their leave types</p>
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
                  {canManage && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(policy)}>
                      <Pencil className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {policy.types.map((t) => (
                    <Badge
                      key={t.id ?? t.leaveType}
                      variant="secondary"
                      className="text-[10px] bg-primary/10 text-primary border-0"
                    >
                      {t.name || LEAVE_TYPE_LABELS[t.leaveType] || t.leaveType} · {t.daysPerYear}d
                    </Badge>
                  ))}
                  {policy.types.length === 0 && (
                    <span className="text-xs text-muted-foreground">No leave types</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div><span className="font-medium text-foreground">{policy.types.length}</span> leave type{policy.types.length === 1 ? '' : 's'}</div>
                  <div><span className="font-medium text-foreground">{policy.employeeCount ?? 0}</span> employees</div>
                  <div>{policy.isActive ? <span className="text-accent-green">Active</span> : <span className="text-muted-foreground">Inactive</span>}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[92vw] sm:w-[85vw] lg:w-[70vw] max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Leave Policy' : 'New Leave Policy'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => save(v))} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:items-end">
              <div className="space-y-1.5">
                <Label htmlFor="lp-name">Policy Name *</Label>
                <Input id="lp-name" placeholder="e.g. Standard Policy" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <label className="flex items-center gap-2 text-sm pb-2">
                <input
                  type="checkbox"
                  className="h-4 w-4"
                  checked={isActive ?? true}
                  onChange={(e) => setValue('isActive', e.target.checked)}
                />
                Active
              </label>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Leave Types</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ ...emptyType })}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Type
                </Button>
              </div>
              {errors.types?.message && (
                <p className="text-xs text-destructive">{errors.types.message}</p>
              )}
              {fields.map((field, index) => {
                const leaveTypeValue = watch(`types.${index}.leaveType`)
                const accrualValue = watch(`types.${index}.accrualType`)
                return (
                  <div key={field.id} className="rounded-lg border border-border p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-muted-foreground">Type {index + 1}</span>
                      {fields.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(index)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Leave Type *</Label>
                        <Select
                          items={Object.fromEntries(LEAVE_TYPES.map((t) => [t, LEAVE_TYPE_LABELS[t] ?? t]))}
                          value={leaveTypeValue ?? ''}
                          onValueChange={(v) => setValue(`types.${index}.leaveType`, v ?? '')}
                        >
                          <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
                          <SelectContent>
                            {LEAVE_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>{LEAVE_TYPE_LABELS[t] ?? t}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.types?.[index]?.leaveType && (
                          <p className="text-xs text-destructive">{errors.types[index]?.leaveType?.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Display Name</Label>
                        <Input placeholder="e.g. Casual Leave" {...register(`types.${index}.name`)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Accrual</Label>
                        <Select
                          items={Object.fromEntries(ACCRUAL_TYPES.map((a) => [a, a]))}
                          value={accrualValue ?? ''}
                          onValueChange={(v) => setValue(`types.${index}.accrualType`, v ?? '')}
                        >
                          <SelectTrigger className="w-full"><SelectValue placeholder="Accrual" /></SelectTrigger>
                          <SelectContent>
                            {ACCRUAL_TYPES.map((a) => (
                              <SelectItem key={a} value={a}>{a}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Days / Year *</Label>
                        <Input type="number" step="any" placeholder="12" {...register(`types.${index}.daysPerYear`)} />
                        {errors.types?.[index]?.daysPerYear && (
                          <p className="text-xs text-destructive">{errors.types[index]?.daysPerYear?.message}</p>
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Carry Forward Max</Label>
                        <Input type="number" placeholder="0" {...register(`types.${index}.carryForwardMax`)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Min Advance Days</Label>
                        <Input type="number" placeholder="0" {...register(`types.${index}.minAdvanceDays`)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Max Consecutive Days</Label>
                        <Input type="number" placeholder="Unlimited" {...register(`types.${index}.maxConsecutiveDays`)} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="h-4 w-4" {...register(`types.${index}.isEncashable`)} />
                        Encashable
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="h-4 w-4" {...register(`types.${index}.isLopEligible`)} />
                        LOP eligible
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <input type="checkbox" className="h-4 w-4" {...register(`types.${index}.allowedInProbation`)} />
                        Allowed in probation
                      </label>
                    </div>
                  </div>
                )
              })}
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
