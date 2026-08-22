import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { employeesApi } from '@/api/employees.api'
import type { Employee } from '@/types/employee.types'
import { getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

const ACCOUNT_TYPES = ['SAVINGS', 'CURRENT'] as const

const schema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountNumber: z.string().min(1, 'Account number is required'),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Invalid IFSC code format'),
  accountType: z.enum(['SAVINGS', 'CURRENT'], { message: 'Account type is required' }),
  branchName: z.string().optional(),
  micrCode: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee
}

export function EditBankDetailsDialog({ open, onOpenChange, employee }: Props) {
  const qc = useQueryClient()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: {
      bankName: employee.bankDetails?.bankName ?? '',
      accountNumber: employee.bankDetails?.accountNumber ?? '',
      ifscCode: employee.bankDetails?.ifscCode ?? '',
      accountType: (employee.bankDetails?.accountType as 'SAVINGS' | 'CURRENT') ?? 'SAVINGS',
      branchName: employee.bankDetails?.branchName ?? '',
      micrCode: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        bankName: employee.bankDetails?.bankName ?? '',
        accountNumber: employee.bankDetails?.accountNumber ?? '',
        ifscCode: employee.bankDetails?.ifscCode ?? '',
        accountType: (employee.bankDetails?.accountType as 'SAVINGS' | 'CURRENT') ?? 'SAVINGS',
        branchName: employee.bankDetails?.branchName ?? '',
        micrCode: '',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employee.id])

  const { mutate: save, isPending } = useMutation({
    mutationFn: (values: FormValues) => employeesApi.updateBankDetails(employee.id, values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee', employee.id] })
      onOpenChange(false)
      toast.success('Bank details updated.')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to update bank details.')),
  })

  const accountType = watch('accountType')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:w-[85vw] lg:w-[70vw] max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Bank Details</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save(v))} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Bank Name *</Label>
              <Input {...register('bankName')} />
              {errors.bankName && <p className="text-xs text-destructive">{errors.bankName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Account Number *</Label>
              <Input {...register('accountNumber')} />
              {errors.accountNumber && <p className="text-xs text-destructive">{errors.accountNumber.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>IFSC Code *</Label>
              <Input placeholder="HDFC0001234" {...register('ifscCode')} />
              {errors.ifscCode && <p className="text-xs text-destructive">{errors.ifscCode.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Account Type *</Label>
              <Select
                items={Object.fromEntries(ACCOUNT_TYPES.map((t) => [t, t.charAt(0) + t.slice(1).toLowerCase()]))}
                value={accountType ?? ''}
                onValueChange={(v) => setValue('accountType', (v ?? 'SAVINGS') as 'SAVINGS' | 'CURRENT')}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {ACCOUNT_TYPES.map((t) => <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.accountType && <p className="text-xs text-destructive">{errors.accountType.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Branch Name</Label>
              <Input {...register('branchName')} />
            </div>
            <div className="space-y-1.5">
              <Label>MICR Code</Label>
              <Input {...register('micrCode')} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
