import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { greenThanksApi } from '@/api/green-thanks.api'
import { employeesApi } from '@/api/employees.api'
import type { Employee } from '@/types/employee.types'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

const schema = z.object({
  toEmployeeId: z.string().min(1, 'Recipient is required'),
  points: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number().int().min(1, 'Must be at least 1')
  ),
  reason: z.string().min(1, 'Required'),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SendGreenThanksDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient()

  const { data: employeesData } = useQuery({
    queryKey: ['employees', { forSelect: true }],
    queryFn: () => employeesApi.list({ limit: 100 }),
    enabled: open,
  })
  const employees = (employeesData as { data?: Employee[] })?.data ?? []

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })
  const toEmployeeId = watch('toEmployeeId')

  const { mutate: send, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      greenThanksApi.send({
        toEmployeeId: values.toEmployeeId,
        points: values.points,
        reason: values.reason,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['green-thanks'] })
      onOpenChange(false)
      reset()
      toast.success('Green Thanks sent.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to send Green Thanks.')),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="w-[92vw] sm:w-[85vw] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Green Thanks</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => send(v))} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Recipient *</Label>
            <Select
              items={Object.fromEntries(employees.map((e) => [e.id, `${e.firstName} ${e.lastName} (${e.empCode})`]))}
              value={toEmployeeId ?? ''}
              onValueChange={(v) => setValue('toEmployeeId', v ?? '')}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.empCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.toEmployeeId && <p className="text-xs text-destructive">{errors.toEmployeeId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="points">Points *</Label>
            <Input id="points" type="number" min="1" step="1" {...register('points')} />
            {errors.points && <p className="text-xs text-destructive">{errors.points.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea id="reason" placeholder="Why does this person deserve Green Thanks?" {...register('reason')} />
            {errors.reason && <p className="text-xs text-destructive">{errors.reason.message}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
