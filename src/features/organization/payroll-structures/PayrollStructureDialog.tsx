import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { payrollStructuresApi } from '@/api/payroll-structures.api'
import type { PayrollStructure } from '@/types/organization.types'
import { getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

const componentSchema = z.object({
  name: z.string().min(2, 'Min 2 characters'),
  type: z.enum(['FIXED', 'VARIABLE', 'PERCENTAGE']),
  value: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number({ message: 'Value is required' }).min(0)
  ),
  baseOn: z.enum(['CTC', 'BASIC', 'GROSS']).optional(),
  isDeductible: z.boolean(),
  description: z.string().optional(),
})

const schema = z.object({
  name: z.string().min(2, 'Min 2 characters'),
  isActive: z.boolean(),
  components: z.array(componentSchema).min(1, 'At least one component is required'),
})
type FormValues = z.infer<typeof schema>

const TYPE_ITEMS = { FIXED: 'Fixed', VARIABLE: 'Variable', PERCENTAGE: 'Percentage' }
const BASE_ON_ITEMS = { CTC: 'CTC', BASIC: 'Basic', GROSS: 'Gross' }

const emptyComponent = {
  name: '',
  type: 'FIXED' as const,
  value: 0,
  baseOn: 'CTC' as const,
  isDeductible: false,
  description: '',
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editItem: PayrollStructure | null
}

export function PayrollStructureDialog({ open, onOpenChange, editItem }: Props) {
  const qc = useQueryClient()

  const { register, control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { name: '', isActive: true, components: [emptyComponent] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'components' })
  const isActive = watch('isActive')

  useEffect(() => {
    if (!open) return
    if (editItem) {
      reset({
        name: editItem.name,
        isActive: editItem.isActive,
        components: editItem.components.length ? editItem.components : [emptyComponent],
      })
    } else {
      reset({ name: '', isActive: true, components: [emptyComponent] })
    }
  }, [open, editItem, reset])

  const { mutate: save, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      editItem
        ? payrollStructuresApi.update(editItem.id, values)
        : payrollStructuresApi.create(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll-structures'] })
      onOpenChange(false)
      toast.success(editItem ? 'Payroll structure updated.' : 'Payroll structure created.')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to save payroll structure.')),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:w-[85vw] lg:w-[70vw] max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Edit Payroll Structure' : 'New Payroll Structure'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save(v))} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3 sm:items-end">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input placeholder="e.g. Standard CTC Structure" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="flex items-center gap-2 pb-2">
              <Switch checked={isActive} onCheckedChange={(checked) => setValue('isActive', checked === true)} />
              <Label className="text-sm">Active</Label>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Components</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => append(emptyComponent)}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add Component
              </Button>
            </div>
            {errors.components?.message && (
              <p className="text-xs text-destructive">{errors.components.message}</p>
            )}
            {fields.map((field, index) => {
              const type = watch(`components.${index}.type`)
              return (
                <div key={field.id} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-[1.5fr_1fr_1fr_auto] gap-2 sm:items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Name</Label>
                      <Input {...register(`components.${index}.name`)} />
                      {errors.components?.[index]?.name && (
                        <p className="text-xs text-destructive">{errors.components[index]?.name?.message}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Type</Label>
                      <Select
                        items={TYPE_ITEMS}
                        value={type ?? 'FIXED'}
                        onValueChange={(v) =>
                          setValue(`components.${index}.type`, (v ?? 'FIXED') as FormValues['components'][number]['type'])
                        }
                      >
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(TYPE_ITEMS).map(([k, label]) => (
                            <SelectItem key={k} value={k}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Value</Label>
                      <Input type="number" step="0.01" {...register(`components.${index}.value`)} />
                      {errors.components?.[index]?.value && (
                        <p className="text-xs text-destructive">{errors.components[index]?.value?.message}</p>
                      )}
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 sm:items-end">
                    <div className="space-y-1">
                      <Label className="text-xs">Base On</Label>
                      <Select
                        items={BASE_ON_ITEMS}
                        value={watch(`components.${index}.baseOn`) ?? 'CTC'}
                        onValueChange={(v) =>
                          setValue(`components.${index}.baseOn`, (v ?? 'CTC') as FormValues['components'][number]['baseOn'])
                        }
                      >
                        <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(BASE_ON_ITEMS).map(([k, label]) => (
                            <SelectItem key={k} value={k}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Input {...register(`components.${index}.description`)} />
                    </div>
                    <div className="flex items-center gap-2 pb-2">
                      <Checkbox
                        checked={watch(`components.${index}.isDeductible`)}
                        onCheckedChange={(checked) => setValue(`components.${index}.isDeductible`, checked === true)}
                      />
                      <Label className="text-xs">Deduction</Label>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editItem ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
