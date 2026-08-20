import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { todosApi } from '@/api/incentives.api'
import type { TodoTask } from '@/types/incentives.types'
import { toast } from 'sonner'

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
  todo: TodoTask | null
}

export function ApproveTodoDialog({ open, onOpenChange, todo }: Props) {
  const qc = useQueryClient()
  const [decision, setDecision] = useState<'approve' | 'reject'>('approve')
  const [hold, setHold] = useState(false)
  const [payrollMonth, setPayrollMonth] = useState<number | undefined>(undefined)
  const [payrollYear, setPayrollYear] = useState<number | undefined>(undefined)
  const [rejectionNote, setRejectionNote] = useState('')

  const resetForm = () => {
    setDecision('approve')
    setHold(false)
    setPayrollMonth(undefined)
    setPayrollYear(undefined)
    setRejectionNote('')
  }

  const { mutate: review, isPending } = useMutation({
    mutationFn: () => {
      if (!todo) return Promise.reject(new Error('No todo selected'))
      return todosApi.approve(todo.id, {
        approve: decision === 'approve',
        hold: decision === 'approve' ? hold : undefined,
        payrollMonth: decision === 'approve' ? payrollMonth : undefined,
        payrollYear: decision === 'approve' ? payrollYear : undefined,
        rejectionNote: decision === 'reject' ? rejectionNote || undefined : undefined,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['todos'] })
      qc.invalidateQueries({ queryKey: ['incentive-ledger'] })
      onOpenChange(false)
      resetForm()
      toast.success(decision === 'approve' ? 'Todo approved.' : 'Todo rejected.')
    },
    onError: () => toast.error('Failed to review todo.'),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) resetForm()
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Review Todo</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="flex gap-2">
            <Button
              type="button"
              variant={decision === 'approve' ? 'default' : 'outline'}
              className="flex-1"
              onClick={() => setDecision('approve')}
            >
              Approve
            </Button>
            <Button
              type="button"
              variant={decision === 'reject' ? 'default' : 'outline'}
              className={decision === 'reject' ? 'flex-1 bg-destructive hover:bg-destructive/90' : 'flex-1'}
              onClick={() => setDecision('reject')}
            >
              Reject
            </Button>
          </div>

          {decision === 'approve' && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hold"
                  checked={hold}
                  onCheckedChange={(checked) => setHold(checked === true)}
                />
                <Label htmlFor="hold" className="cursor-pointer">Hold for later payroll</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Payroll Month</Label>
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
                  <Label>Payroll Year</Label>
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
            </>
          )}

          {decision === 'reject' && (
            <div className="space-y-1.5">
              <Label htmlFor="rejectionNote">Rejection Note</Label>
              <Textarea
                id="rejectionNote"
                placeholder="Reason for rejection…"
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              type="button"
              disabled={isPending}
              className={decision === 'reject' ? 'bg-destructive hover:bg-destructive/90' : ''}
              onClick={() => review()}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {decision === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
