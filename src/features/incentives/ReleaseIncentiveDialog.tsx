import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { incentiveLedgerApi } from '@/api/incentives.api'
import type { IncentiveLedgerEntry } from '@/types/incentives.types'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

const MONTH_OPTIONS = [
  { value: 1, label: 'January' }, { value: 2, label: 'February' }, { value: 3, label: 'March' },
  { value: 4, label: 'April' }, { value: 5, label: 'May' }, { value: 6, label: 'June' },
  { value: 7, label: 'July' }, { value: 8, label: 'August' }, { value: 9, label: 'September' },
  { value: 10, label: 'October' }, { value: 11, label: 'November' }, { value: 12, label: 'December' },
]
const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = [CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1]

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  entry: IncentiveLedgerEntry | null
}

export function ReleaseIncentiveDialog({ open, onOpenChange, entry }: Props) {
  const qc = useQueryClient()
  const [payrollMonth, setPayrollMonth] = useState<number | undefined>(undefined)
  const [payrollYear, setPayrollYear] = useState<number | undefined>(undefined)

  const resetForm = () => {
    setPayrollMonth(undefined)
    setPayrollYear(undefined)
  }

  const { mutate: release, isPending } = useMutation({
    mutationFn: () => {
      if (!entry) return Promise.reject(new Error('No ledger entry selected'))
      return incentiveLedgerApi.release(entry.id, { payrollMonth, payrollYear })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incentive-ledger'] })
      onOpenChange(false)
      resetForm()
      toast.success('Incentive released.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to release incentive.')),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) resetForm()
      }}
    >
      <DialogContent className="w-[92vw] sm:w-[85vw] max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Release Incentive</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <p className="text-sm text-muted-foreground">
            Release the held incentive for{' '}
            {entry?.employee ? `${entry.employee.firstName} ${entry.employee.lastName}` : 'this employee'}.
            Leave the target period blank to use the original payroll month/year.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Target Month</Label>
              <Select
                items={Object.fromEntries(MONTH_OPTIONS.map((m) => [String(m.value), m.label]))}
                value={payrollMonth != null ? String(payrollMonth) : ''}
                onValueChange={(v) => setPayrollMonth(v ? Number(v) : undefined)}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {MONTH_OPTIONS.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Target Year</Label>
              <Select
                items={Object.fromEntries(YEAR_OPTIONS.map((y) => [String(y), String(y)]))}
                value={payrollYear != null ? String(payrollYear) : ''}
                onValueChange={(v) => setPayrollYear(v ? Number(v) : undefined)}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {YEAR_OPTIONS.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="button" disabled={isPending} onClick={() => release()}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Release
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
