import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Resolver } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { loanApi } from '@/api/loan.api'
import type { Loan } from '@/types/loan.types'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

const schema = z.object({
  interestRate: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number().min(0, 'Interest rate must be 0 or more')
  ),
  amountApproved: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number().min(1).optional()
  ),
  tenureMonths: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number().int().min(1).max(120).optional()
  ),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  loan: Loan | null
}

export function ApproveLoanDialog({ open, onOpenChange, loan }: Props) {
  const qc = useQueryClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })

  const { mutate: approve, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      if (!loan) return Promise.reject(new Error('No loan selected'))
      return loanApi.approve(loan.id, {
        interestRate: values.interestRate,
        amountApproved: values.amountApproved,
        tenureMonths: values.tenureMonths,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] })
      qc.invalidateQueries({ queryKey: ['loan', loan?.id] })
      onOpenChange(false)
      reset()
      toast.success('Loan approved.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to approve loan.')),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="w-[92vw] sm:w-[85vw] max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Approve Loan</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => approve(v))} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="interestRate">Interest Rate (% p.a.) *</Label>
            <Input id="interestRate" type="number" step="0.01" min="0" {...register('interestRate')} />
            {errors.interestRate && (
              <p className="text-xs text-destructive">{errors.interestRate.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="amountApproved">Amount Approved</Label>
            <Input
              id="amountApproved"
              type="number"
              step="0.01"
              min="0"
              placeholder={loan ? String(loan.amountRequested) : ''}
              {...register('amountApproved')}
            />
            {errors.amountApproved && (
              <p className="text-xs text-destructive">{errors.amountApproved.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="tenureMonths">Tenure (Months)</Label>
            <Input
              id="tenureMonths"
              type="number"
              min="1"
              max="120"
              placeholder={loan?.tenureMonths ? String(loan.tenureMonths) : ''}
              {...register('tenureMonths')}
            />
            {errors.tenureMonths && (
              <p className="text-xs text-destructive">{errors.tenureMonths.message}</p>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Approving generates the EMI amortization schedule and activates the loan.
          </p>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
