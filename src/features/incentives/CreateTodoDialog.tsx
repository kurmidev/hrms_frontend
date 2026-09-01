import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmployeeSelect } from '@/components/shared/EmployeeSelect'
import { todosApi, incentiveRulesApi } from '@/api/incentives.api'
import type { IncentiveRule } from '@/types/incentives.types'
import { getApiErrorMessage } from '@/lib/utils'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

const schema = z.object({
  title: z.string().min(1, 'Required'),
  description: z.string().optional(),
  employeeId: z.string().optional(),
  incentiveRuleId: z.string().optional(),
  quantity: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number().min(0).optional()
  ),
  unit: z.string().optional(),
  dueDate: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateTodoDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient()
  const canAssignToOthers = usePermission('todo:approve')
  const ownEmployeeId = useAuthStore((s) => s.user?.employee?.id ?? '')

  const { data: rulesData } = useQuery({
    queryKey: ['incentive-rules', { forSelect: true }],
    queryFn: () => incentiveRulesApi.list({ limit: 100 }),
    enabled: open,
  })
  const rules = (rulesData as { data?: IncentiveRule[] })?.data ?? []

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { employeeId: ownEmployeeId },
  })
  const incentiveRuleId = watch('incentiveRuleId')
  const employeeId = watch('employeeId')

  const { mutate: create, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      todosApi.create({
        title: values.title,
        description: values.description || undefined,
        employeeId: values.employeeId || undefined,
        incentiveRuleId: values.incentiveRuleId || undefined,
        quantity: values.quantity,
        unit: values.unit || undefined,
        dueDate: values.dueDate || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['todos'] })
      onOpenChange(false)
      reset()
      toast.success('Todo created.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to create todo.')),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="w-[92vw] sm:w-[85vw] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Todo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => create(v))} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" placeholder="e.g. Complete site survey" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" placeholder="Details…" {...register('description')} />
          </div>
          {canAssignToOthers && (
            <div className="space-y-1.5">
              <Label>Employee {!ownEmployeeId && '*'}</Label>
              <EmployeeSelect
                value={employeeId ?? ''}
                onValueChange={(v) => setValue('employeeId', v, { shouldValidate: true })}
                placeholder="Select employee"
              />
              {!ownEmployeeId && !employeeId && (
                <p className="text-xs text-muted-foreground">
                  Your account has no employee record — choose who this todo is for.
                </p>
              )}
            </div>
          )}
          <div className="space-y-1.5">
            <Label>Incentive Rule</Label>
            <Select
              items={Object.fromEntries(rules.map((r) => [r.id, `${r.name} (${Number(r.rate).toFixed(2)})`]))}
              value={incentiveRuleId ?? ''}
              onValueChange={(v) => setValue('incentiveRuleId', v ?? '')}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                {rules.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name} ({Number(r.rate).toFixed(2)})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="quantity">Quantity</Label>
              <Input id="quantity" type="number" step="0.01" min="0" {...register('quantity')} />
              {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit">Unit</Label>
              <Input id="unit" placeholder="e.g. units" {...register('unit')} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input id="dueDate" type="date" {...register('dueDate')} />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Todo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
