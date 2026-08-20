import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Resolver } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { payrollApi } from '@/api/payroll.api'
import { toast } from 'sonner'

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
]

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

const schema = z.object({
  month: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().min(1).max(12)),
  year: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().min(2000).max(2100)),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InitiatePayrollDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient()

  const { setValue, watch, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { month: new Date().getMonth() + 1, year: CURRENT_YEAR },
  })
  const month = watch('month')
  const year = watch('year')

  const { mutate: initiate, isPending } = useMutation({
    mutationFn: (values: FormValues) => payrollApi.initiateRun({ month: values.month, year: values.year }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll-runs'] })
      onOpenChange(false)
      reset()
      toast.success('Payroll run initiated.')
    },
    onError: () => toast.error('Failed to initiate payroll run.'),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:w-[85vw] max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Run Payroll</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => initiate(v))} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="month">Month *</Label>
              <Select
                items={Object.fromEntries(MONTH_OPTIONS.map((m) => [String(m.value), m.label]))}
                value={month != null ? String(month) : ''}
                onValueChange={(v) => setValue('month', v ? Number(v) : (undefined as unknown as number))}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select month" /></SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.month && <p className="text-xs text-destructive">{errors.month.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="year">Year *</Label>
              <Select
                items={Object.fromEntries(YEAR_OPTIONS.map((y) => [String(y), String(y)]))}
                value={year != null ? String(year) : ''}
                onValueChange={(v) => setValue('year', v ? Number(v) : (undefined as unknown as number))}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select year" /></SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.year && <p className="text-xs text-destructive">{errors.year.message}</p>}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            This will initiate payroll processing for all active employees for the selected period.
          </p>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run Payroll
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
