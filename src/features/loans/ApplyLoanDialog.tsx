import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Resolver } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { EmployeeSelect } from '@/components/shared/EmployeeSelect'
import { loanApi } from '@/api/loan.api'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/store/auth.store'

const schema = z.object({
  employeeId: z.string().optional(),
  amountRequested: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number().min(1, 'Amount must be greater than 0')
  ),
  tenureMonths: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number().int('Must be a whole number').min(1, 'Minimum 1 month').max(120, 'Maximum 120 months')
  ),
  reason: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ApplyLoanDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient()
  const canApplyForOthers = usePermission('loan:approve')
  const ownEmployeeId = useAuthStore((s) => s.user?.employee?.id ?? '')

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { employeeId: ownEmployeeId },
  })
  const employeeId = watch('employeeId')

  const { mutate: apply, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      loanApi.apply({
        employeeId: values.employeeId || undefined,
        amountRequested: values.amountRequested,
        tenureMonths: values.tenureMonths,
        reason: values.reason || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] })
      onOpenChange(false)
      reset()
      toast.success('Loan application submitted.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to submit loan application.')),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:w-[85vw] max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for Loan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => apply(v))} className="space-y-4 py-2">
          {canApplyForOthers && (
            <div className="space-y-1.5">
              <Label>Employee {!ownEmployeeId && '*'}</Label>
              <EmployeeSelect
                value={employeeId ?? ''}
                onValueChange={(v) => setValue('employeeId', v, { shouldValidate: true })}
                placeholder="Select employee"
              />
              {!ownEmployeeId && !employeeId && (
                <p className="text-xs text-muted-foreground">
                  Your account has no employee record — choose who this loan is for.
                </p>
              )}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="amountRequested">Amount Requested *</Label>
            <Input
              id="amountRequested"
              type="number"
              step="0.01"
              min="0"
              {...register('amountRequested')}
            />
            {errors.amountRequested && (
              <p className="text-xs text-destructive">{errors.amountRequested.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tenureMonths">Tenure (Months) *</Label>
            <Input
              id="tenureMonths"
              type="number"
              min="1"
              max="120"
              {...register('tenureMonths')}
            />
            {errors.tenureMonths && (
              <p className="text-xs text-destructive">{errors.tenureMonths.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason</Label>
            <Textarea id="reason" placeholder="Reason for the loan…" {...register('reason')} />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Application
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
