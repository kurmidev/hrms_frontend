import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { disciplinaryApi } from '@/api/disciplinary.api'
import { employeesApi } from '@/api/employees.api'
import type { Employee } from '@/types/employee.types'
import type { DisciplinaryActionType } from '@/types/disciplinary.types'
import { toast } from 'sonner'

const MEMO_TYPES: DisciplinaryActionType[] = ['VERBAL_WARNING', 'WRITTEN_WARNING', 'DEMOTION', 'SUSPENSION']

const schema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  type: z.enum(['VERBAL_WARNING', 'WRITTEN_WARNING', 'DEMOTION', 'SUSPENSION']),
  title: z.string().min(1, 'Title is required'),
  reason: z.string().min(1, 'Reason is required'),
  issuingAuthority: z.string().optional(),
  approvalReference: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function IssueMemoDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient()

  const { data: employeesData } = useQuery({
    queryKey: ['employees', { forSelect: true }],
    queryFn: () => employeesApi.list({ limit: 200 }),
    enabled: open,
  })
  const employees = (employeesData as { data?: Employee[] })?.data ?? []

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })
  const employeeId = watch('employeeId')
  const type = watch('type')

  const { data: summary } = useQuery({
    queryKey: ['disciplinary-summary', employeeId],
    queryFn: () => disciplinaryApi.employeeSummary(employeeId),
    enabled: !!employeeId,
  })

  const { mutate: create, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      disciplinaryApi.create({
        employeeId: values.employeeId,
        type: values.type,
        title: values.title,
        reason: values.reason,
        issuingAuthority: values.issuingAuthority || undefined,
        approvalReference: values.approvalReference || undefined,
      }),
    onSuccess: (memo) => {
      qc.invalidateQueries({ queryKey: ['disciplinary'] })
      qc.invalidateQueries({ queryKey: ['disciplinary-summary'] })
      onOpenChange(false)
      reset()
      if (memo.terminationReviewTriggered) {
        toast.warning('Memo issued. Employee flagged for termination review (5-memo threshold reached).')
      } else {
        toast.success('Memo issued.')
      }
    },
    onError: () => toast.error('Failed to issue memo.'),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Issue Disciplinary Memo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => create(v))} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Employee *</Label>
            <Select value={employeeId ?? ''} onValueChange={(v) => setValue('employeeId', v ?? '')}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.empCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employeeId && <p className="text-xs text-destructive">{errors.employeeId.message}</p>}
          </div>

          {summary && summary.activeMemoCount >= 4 && (
            <div
              className={`flex items-center gap-2 rounded-md border p-2 text-xs font-medium ${
                summary.flaggedForTerminationReview
                  ? 'border-red-300 bg-red-50 text-red-700'
                  : 'border-amber-300 bg-amber-50 text-amber-700'
              }`}
            >
              <AlertTriangle className="h-4 w-4 shrink-0" />
              {summary.flaggedForTerminationReview
                ? `Flagged for termination review (${summary.activeMemoCount}/${summary.threshold} active memos)`
                : `Warning: ${summary.activeMemoCount}/${summary.threshold} active memos — one more triggers a termination review flag.`}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Type *</Label>
            <Select value={type ?? ''} onValueChange={(v) => setValue('type', (v ?? '') as DisciplinaryActionType)}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
              <SelectContent>
                {MEMO_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason / Details *</Label>
            <Textarea id="reason" rows={3} {...register('reason')} />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="issuingAuthority">Issuing Authority</Label>
            <Input id="issuingAuthority" {...register('issuingAuthority')} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="approvalReference">Approval Reference</Label>
            <Input id="approvalReference" {...register('approvalReference')} />
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Issue Memo
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
