import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { insuranceApi } from '@/api/insurance.api'
import type { InsurancePolicy, InsuranceType } from '@/types/insurance.types'
import { toast } from 'sonner'

const POLICY_TYPES: InsuranceType[] = ['HEALTH', 'ACCIDENTAL']

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  provider: z.string().min(1, 'Provider is required'),
  policyNumber: z.string().min(1, 'Policy number is required'),
  type: z.enum(['HEALTH', 'ACCIDENTAL']),
  coverageAmount: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().min(0, 'Required')),
  premium: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().min(0, 'Required')),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
  renewalDate: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  policy: InsurancePolicy | null
}

export function PolicyFormDialog({ open, onOpenChange, policy }: Props) {
  const qc = useQueryClient()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })
  const type = watch('type')

  useEffect(() => {
    if (open) {
      if (policy) {
        reset({
          name: policy.name,
          provider: policy.provider,
          policyNumber: policy.policyNumber,
          type: policy.type,
          coverageAmount: policy.coverageAmount,
          premium: policy.premium,
          validFrom: policy.validFrom ? policy.validFrom.slice(0, 10) : '',
          validTo: policy.validTo ? policy.validTo.slice(0, 10) : '',
          renewalDate: policy.renewalDate ? policy.renewalDate.slice(0, 10) : '',
        })
      } else {
        reset({ name: '', provider: '', policyNumber: '', validFrom: '', validTo: '', renewalDate: '' })
      }
    }
  }, [open, policy, reset])

  const { mutate: save, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        name: values.name,
        provider: values.provider,
        policyNumber: values.policyNumber,
        type: values.type,
        coverageAmount: values.coverageAmount,
        premium: values.premium,
        validFrom: values.validFrom || undefined,
        validTo: values.validTo || undefined,
        renewalDate: values.renewalDate || undefined,
      }
      return policy ? insuranceApi.updatePolicy(policy.id, payload) : insuranceApi.createPolicy(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['insurance-policies'] })
      onOpenChange(false)
      toast.success(policy ? 'Policy updated.' : 'Policy created.')
    },
    onError: () => toast.error('Failed to save policy.'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{policy ? 'Edit Policy' : 'Add Policy'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save(v))} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="provider">Provider *</Label>
              <Input id="provider" {...register('provider')} />
              {errors.provider && <p className="text-xs text-destructive">{errors.provider.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="policyNumber">Policy Number *</Label>
              <Input id="policyNumber" {...register('policyNumber')} />
              {errors.policyNumber && <p className="text-xs text-destructive">{errors.policyNumber.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Type *</Label>
            <Select value={type ?? ''} onValueChange={(v) => setValue('type', (v ?? '') as InsuranceType)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {POLICY_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="coverageAmount">Coverage Amount *</Label>
              <Input id="coverageAmount" type="number" min="0" step="0.01" {...register('coverageAmount')} />
              {errors.coverageAmount && <p className="text-xs text-destructive">{errors.coverageAmount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="premium">Premium *</Label>
              <Input id="premium" type="number" min="0" step="0.01" {...register('premium')} />
              {errors.premium && <p className="text-xs text-destructive">{errors.premium.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="validFrom">Valid From</Label>
              <Input id="validFrom" type="date" {...register('validFrom')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="validTo">Valid To</Label>
              <Input id="validTo" type="date" {...register('validTo')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="renewalDate">Renewal Date</Label>
              <Input id="renewalDate" type="date" {...register('renewalDate')} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {policy ? 'Save' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
