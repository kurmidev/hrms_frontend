import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { exitApi } from '@/api/exit.api'
import { employeesApi } from '@/api/employees.api'
import type { Employee } from '@/types/employee.types'
import type { ExitType, ExitInitiator } from '@/types/exit.types'
import { toast } from 'sonner'

const EXIT_TYPES: ExitType[] = ['RESIGNATION', 'TERMINATION', 'ABSCONDING', 'RETIREMENT']
const INITIATORS: ExitInitiator[] = ['SELF', 'MANAGEMENT']

const schema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  type: z.enum(['RESIGNATION', 'TERMINATION', 'ABSCONDING', 'RETIREMENT']),
  initiatedBy: z.enum(['SELF', 'MANAGEMENT']),
  reason: z.string().min(1, 'Reason is required'),
  noticeStartDate: z.string().optional(),
  lastWorkingDate: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function InitiateExitDialog({ open, onOpenChange }: Props) {
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
  const initiatedBy = watch('initiatedBy')

  const { mutate: initiate, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      exitApi.initiate({
        employeeId: values.employeeId,
        type: values.type,
        initiatedBy: values.initiatedBy,
        reason: values.reason,
        noticeStartDate: values.noticeStartDate || undefined,
        lastWorkingDate: values.lastWorkingDate || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['exit'] })
      onOpenChange(false)
      reset()
      toast.success('Exit initiated.')
    },
    onError: () => toast.error('Failed to initiate exit.'),
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
          <DialogTitle>Initiate Exit</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => initiate(v))} className="space-y-4 py-2">
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type *</Label>
              <Select value={type ?? ''} onValueChange={(v) => setValue('type', (v ?? '') as ExitType)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {EXIT_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Initiated By *</Label>
              <Select value={initiatedBy ?? ''} onValueChange={(v) => setValue('initiatedBy', (v ?? '') as ExitInitiator)}>
                <SelectTrigger className="w-full"><SelectValue placeholder="Select initiator" /></SelectTrigger>
                <SelectContent>
                  {INITIATORS.map((i) => (
                    <SelectItem key={i} value={i}>{i}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.initiatedBy && <p className="text-xs text-destructive">{errors.initiatedBy.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea id="reason" rows={3} {...register('reason')} />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="noticeStartDate">Notice Start Date</Label>
              <Input id="noticeStartDate" type="date" {...register('noticeStartDate')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastWorkingDate">Last Working Date</Label>
              <Input id="lastWorkingDate" type="date" {...register('lastWorkingDate')} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Initiate Exit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
