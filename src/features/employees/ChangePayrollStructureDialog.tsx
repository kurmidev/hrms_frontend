import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { payrollStructuresApi } from '@/api/payroll-structures.api'
import { employeesApi } from '@/api/employees.api'
import type { PayrollStructure } from '@/types/organization.types'
import { getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

interface EmployeeSummary {
  id: string
  payrollStructureId: string | null
  payrollStructure?: { id: string; name: string } | null
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: EmployeeSummary
}

export function ChangePayrollStructureDialog({ open, onOpenChange, employee }: Props) {
  const qc = useQueryClient()
  const [payrollStructureId, setPayrollStructureId] = useState(employee.payrollStructureId ?? '')

  useEffect(() => {
    if (open) setPayrollStructureId(employee.payrollStructureId ?? '')
  }, [open, employee.payrollStructureId])

  const { data } = useQuery({
    queryKey: ['payroll-structures', { forSelect: true }],
    queryFn: () => payrollStructuresApi.list({ limit: 100 }),
    enabled: open,
  })
  const structures = (data as { data?: PayrollStructure[] })?.data ?? []

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => employeesApi.update(employee.id, { payrollStructureId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee', employee.id] })
      qc.invalidateQueries({ queryKey: ['employees'] })
      onOpenChange(false)
      const newName = structures.find((s) => s.id === payrollStructureId)?.name ?? 'selected structure'
      toast.success(`Payroll structure changed to ${newName}.`)
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to change payroll structure.')),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:w-[85vw] max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Change Payroll Structure</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-border bg-muted/40 px-3 py-2">
            <p className="text-xs text-muted-foreground">Current Structure</p>
            <p className="text-sm font-medium text-foreground">{employee.payrollStructure?.name ?? 'None assigned'}</p>
          </div>
          <div className="space-y-1.5">
            <Label>New Structure *</Label>
            <Select
              items={Object.fromEntries(structures.map((s) => [s.id, s.name]))}
              value={payrollStructureId}
              onValueChange={(v) => setPayrollStructureId(v ?? '')}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Select structure" /></SelectTrigger>
              <SelectContent>
                {structures.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            type="button"
            disabled={isPending || !payrollStructureId || payrollStructureId === employee.payrollStructureId}
            onClick={() => save()}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
