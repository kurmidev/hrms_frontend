import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { taxRulesApi } from '@/api/tax-rules.api'
import type { TaxRule, PayrollCalculationType, PayrollApplicableOn } from '@/types/organization.types'
import type { EmploymentType } from '@/types/employee.types'
import { EMPLOYMENT_TYPE_LABELS } from '@/lib/constants'
import { getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

const CALCULATION_TYPE_ITEMS: Record<PayrollCalculationType, string> = {
  PERCENTAGE: 'Percentage',
  FIXED: 'Fixed Amount',
  SLAB_BASED: 'Slab Based',
}

const APPLICABLE_ON_ITEMS: Record<PayrollApplicableOn, string> = {
  GROSS: 'Gross',
  BASIC: 'Basic',
  NET: 'Net',
  CUSTOM: 'Custom',
}

const slabSchema = z.object({
  fromAmount: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number({ message: 'Required' }).min(0)),
  toAmount: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().min(0).optional()),
  rate: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().min(0).optional()),
  fixedAmount: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().min(0).optional()),
})

const schema = z.object({
  name: z.string().min(2, 'Min 2 characters'),
  code: z.string().optional(),
  type: z.string().min(1, 'Type is required'),
  calculationType: z.enum(['PERCENTAGE', 'FIXED', 'SLAB_BASED']),
  applicableOn: z.enum(['GROSS', 'BASIC', 'NET', 'CUSTOM']),
  isStatutory: z.boolean(),
  isActive: z.boolean(),
  // PERCENTAGE config
  rate: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().min(0).optional()),
  employeeSplit: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().min(0).optional()),
  employerSplit: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().min(0).optional()),
  // FIXED config
  amount: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().min(0).optional()),
  // SLAB_BASED config
  slabs: z.array(slabSchema).optional(),
  // applicabilityRules (advanced, optional)
  employmentTypes: z.array(z.string()).optional(),
  designationLevelMin: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().min(1).optional()),
  designationLevelMax: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().min(1).optional()),
  salaryCeiling: z.preprocess((v) => (v === '' || v == null ? undefined : Number(v)), z.number().min(0).optional()),
  effectiveFrom: z.string().min(1, 'Effective from date is required'),
  effectiveTo: z.string().optional(),
}).superRefine((values, ctx) => {
  if (values.calculationType === 'PERCENTAGE' && (values.rate == null)) {
    ctx.addIssue({ code: 'custom', message: 'Rate is required', path: ['rate'] })
  }
  if (values.calculationType === 'FIXED' && values.amount == null) {
    ctx.addIssue({ code: 'custom', message: 'Amount is required', path: ['amount'] })
  }
  if (values.calculationType === 'SLAB_BASED' && (!values.slabs || values.slabs.length === 0)) {
    ctx.addIssue({ code: 'custom', message: 'At least one slab is required', path: ['slabs'] })
  }
})
type FormValues = z.infer<typeof schema>

const emptySlab = { fromAmount: 0, toAmount: undefined, rate: undefined, fixedAmount: undefined }

const EMPTY_DEFAULTS: FormValues = {
  name: '',
  code: '',
  type: '',
  calculationType: 'PERCENTAGE',
  applicableOn: 'GROSS',
  isStatutory: false,
  isActive: true,
  rate: undefined,
  employeeSplit: undefined,
  employerSplit: undefined,
  amount: undefined,
  slabs: [emptySlab],
  employmentTypes: [],
  designationLevelMin: undefined,
  designationLevelMax: undefined,
  salaryCeiling: undefined,
  effectiveFrom: '',
  effectiveTo: '',
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  editItem: TaxRule | null
}

function toFormValues(item: TaxRule): FormValues {
  const config = item.config as Record<string, unknown>
  const slabsRaw = (config.slabs as Array<Record<string, unknown>> | undefined) ?? []
  return {
    name: item.name,
    code: item.code ?? '',
    type: item.type,
    calculationType: item.calculationType,
    applicableOn: item.applicableOn,
    isStatutory: item.isStatutory,
    isActive: item.isActive,
    rate: typeof config.rate === 'number' ? config.rate : undefined,
    employeeSplit: typeof config.employeeSplit === 'number' ? config.employeeSplit : undefined,
    employerSplit: typeof config.employerSplit === 'number' ? config.employerSplit : undefined,
    amount: typeof config.amount === 'number' ? config.amount : undefined,
    slabs: slabsRaw.length
      ? slabsRaw.map((s) => ({
          fromAmount: Number(s.fromAmount ?? 0),
          toAmount: s.toAmount != null ? Number(s.toAmount) : undefined,
          rate: s.rate != null ? Number(s.rate) : undefined,
          fixedAmount: s.fixedAmount != null ? Number(s.fixedAmount) : undefined,
        }))
      : [emptySlab],
    employmentTypes: item.applicabilityRules?.employmentTypes ?? [],
    designationLevelMin: item.applicabilityRules?.designationLevelMin,
    designationLevelMax: item.applicabilityRules?.designationLevelMax,
    salaryCeiling: item.applicabilityRules?.salaryCeiling,
    effectiveFrom: item.effectiveFrom.slice(0, 10),
    effectiveTo: item.effectiveTo ? item.effectiveTo.slice(0, 10) : '',
  }
}

export function TaxRuleDialog({ open, onOpenChange, editItem }: Props) {
  const qc = useQueryClient()
  const [advancedOpen, setAdvancedOpen] = useState(false)

  const { register, control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: EMPTY_DEFAULTS,
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'slabs' })

  const calculationType = watch('calculationType')
  const applicableOn = watch('applicableOn')
  const isStatutory = watch('isStatutory')
  const isActive = watch('isActive')
  const employmentTypes = watch('employmentTypes') ?? []

  useEffect(() => {
    if (!open) return
    setAdvancedOpen(false)
    reset(editItem ? toFormValues(editItem) : EMPTY_DEFAULTS)
  }, [open, editItem, reset])

  const toggleEmploymentType = (type: string) => {
    const current = employmentTypes
    const next = current.includes(type) ? current.filter((t) => t !== type) : [...current, type]
    setValue('employmentTypes', next)
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      let config: Record<string, unknown> = {}
      if (values.calculationType === 'PERCENTAGE') {
        config = {
          rate: values.rate,
          ...(values.employeeSplit != null ? { employeeSplit: values.employeeSplit } : {}),
          ...(values.employerSplit != null ? { employerSplit: values.employerSplit } : {}),
        }
      } else if (values.calculationType === 'FIXED') {
        config = { amount: values.amount }
      } else {
        config = { slabs: values.slabs ?? [] }
      }

      const hasApplicabilityRules =
        (values.employmentTypes && values.employmentTypes.length > 0) ||
        values.designationLevelMin != null ||
        values.designationLevelMax != null ||
        values.salaryCeiling != null

      const applicabilityRules = hasApplicabilityRules
        ? {
            ...(values.employmentTypes && values.employmentTypes.length > 0 ? { employmentTypes: values.employmentTypes } : {}),
            ...(values.designationLevelMin != null ? { designationLevelMin: values.designationLevelMin } : {}),
            ...(values.designationLevelMax != null ? { designationLevelMax: values.designationLevelMax } : {}),
            ...(values.salaryCeiling != null ? { salaryCeiling: values.salaryCeiling } : {}),
          }
        : undefined

      const payload = {
        name: values.name,
        code: values.code || undefined,
        type: values.type,
        calculationType: values.calculationType,
        applicableOn: values.applicableOn,
        isStatutory: values.isStatutory,
        isActive: values.isActive,
        config,
        applicabilityRules,
        effectiveFrom: values.effectiveFrom,
        effectiveTo: values.effectiveTo || undefined,
      }

      return editItem ? taxRulesApi.update(editItem.id, payload) : taxRulesApi.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tax-rules'] })
      onOpenChange(false)
      toast.success(editItem ? 'Tax rule updated.' : 'Tax rule created.')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to save tax rule.')),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:w-[85vw] lg:w-[70vw] max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Edit Tax Rule' : 'New Tax Rule'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save(v))} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input placeholder="e.g. PF Rule FY 2025-26" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Code</Label>
              <Input placeholder="e.g. PF" {...register('code')} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Input placeholder="PF / ESI / PT / TDS / custom" {...register('type')} />
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Calculation Type *</Label>
              <Select
                items={CALCULATION_TYPE_ITEMS}
                value={calculationType}
                onValueChange={(v) => setValue('calculationType', (v ?? 'PERCENTAGE') as PayrollCalculationType)}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(CALCULATION_TYPE_ITEMS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Applicable On *</Label>
              <Select
                items={APPLICABLE_ON_ITEMS}
                value={applicableOn}
                onValueChange={(v) => setValue('applicableOn', (v ?? 'GROSS') as PayrollApplicableOn)}
              >
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(APPLICABLE_ON_ITEMS).map(([k, label]) => (
                    <SelectItem key={k} value={k}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Calculation config — switches by calculationType */}
          <div className="rounded-lg border border-border p-3 space-y-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Calculation Config</Label>

            {calculationType === 'PERCENTAGE' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Rate (%) *</Label>
                  <Input type="number" step="0.01" {...register('rate')} />
                  {errors.rate && <p className="text-xs text-destructive">{errors.rate.message}</p>}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Employee Split (%)</Label>
                  <Input type="number" step="0.01" {...register('employeeSplit')} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Employer Split (%)</Label>
                  <Input type="number" step="0.01" {...register('employerSplit')} />
                </div>
              </div>
            )}

            {calculationType === 'FIXED' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Amount *</Label>
                  <Input type="number" step="0.01" {...register('amount')} />
                  {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                </div>
              </div>
            )}

            {calculationType === 'SLAB_BASED' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Slabs</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => append(emptySlab)}>
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Add Slab
                  </Button>
                </div>
                {errors.slabs?.message && <p className="text-xs text-destructive">{errors.slabs.message}</p>}
                {fields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_1fr_auto] gap-2 sm:items-end rounded-md border border-border/60 p-2">
                    <div className="space-y-1">
                      <Label className="text-xs">From</Label>
                      <Input type="number" step="0.01" {...register(`slabs.${index}.fromAmount`)} />
                      {errors.slabs?.[index]?.fromAmount && (
                        <p className="text-xs text-destructive">{errors.slabs[index]?.fromAmount?.message}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">To (optional)</Label>
                      <Input type="number" step="0.01" {...register(`slabs.${index}.toAmount`)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Rate (%)</Label>
                      <Input type="number" step="0.01" {...register(`slabs.${index}.rate`)} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Fixed Amount</Label>
                      <Input type="number" step="0.01" {...register(`slabs.${index}.fixedAmount`)} />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="effectiveFrom">Effective From *</Label>
              <Input id="effectiveFrom" type="date" {...register('effectiveFrom')} />
              {errors.effectiveFrom && <p className="text-xs text-destructive">{errors.effectiveFrom.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="effectiveTo">Effective To</Label>
              <Input id="effectiveTo" type="date" {...register('effectiveTo')} />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch checked={isStatutory} onCheckedChange={(checked) => setValue('isStatutory', checked === true)} />
              <Label className="text-sm">Statutory</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={isActive} onCheckedChange={(checked) => setValue('isActive', checked === true)} />
              <Label className="text-sm">Active</Label>
            </div>
          </div>

          {/* Advanced applicability rules (optional, collapsible) */}
          <div className="rounded-lg border border-border">
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-foreground"
              onClick={() => setAdvancedOpen((o) => !o)}
            >
              <span>Advanced — Applicability Rules</span>
              {advancedOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
            {advancedOpen && (
              <div className="px-3 pb-3 space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Employment Types</Label>
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([k, label]) => (
                      <label key={k} className="flex items-center gap-1.5 cursor-pointer">
                        <Checkbox
                          checked={employmentTypes.includes(k)}
                          onCheckedChange={() => toggleEmploymentType(k as EmploymentType)}
                        />
                        <span className="text-xs text-foreground">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Designation Level Min</Label>
                    <Input type="number" {...register('designationLevelMin')} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Designation Level Max</Label>
                    <Input type="number" {...register('designationLevelMax')} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Salary Ceiling</Label>
                    <Input type="number" step="0.01" {...register('salaryCeiling')} />
                  </div>
                </div>
              </div>
            )}
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
