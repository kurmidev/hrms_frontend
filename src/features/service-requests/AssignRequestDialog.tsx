import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { serviceRequestApi } from '@/api/service-request.api'
import { employeesApi } from '@/api/employees.api'
import type { Employee } from '@/types/employee.types'
import type { ServiceRequest } from '@/types/service-request.types'
import { toast } from 'sonner'

const schema = z.object({
  assignedTo: z.string().min(1, 'Assignee is required'),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: ServiceRequest | null
}

export function AssignRequestDialog({ open, onOpenChange, request }: Props) {
  const qc = useQueryClient()

  const { data: employeesData } = useQuery({
    queryKey: ['employees', { forSelect: true }],
    queryFn: () => employeesApi.list({ limit: 200 }),
    enabled: open,
  })
  const employees = (employeesData as { data?: Employee[] })?.data ?? []

  const { handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })
  const assignedTo = watch('assignedTo')

  const { mutate: assign, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      if (!request) return Promise.reject(new Error('No request selected'))
      return serviceRequestApi.assign(request.id, { assignedTo: values.assignedTo })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-requests'] })
      qc.invalidateQueries({ queryKey: ['service-request', request?.id] })
      onOpenChange(false)
      reset()
      toast.success('Request assigned.')
    },
    onError: () => toast.error('Failed to assign request.'),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => assign(v))} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Assignee *</Label>
            <Select value={assignedTo ?? ''} onValueChange={(v) => setValue('assignedTo', v ?? '')}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select employee" /></SelectTrigger>
              <SelectContent>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.empCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.assignedTo && <p className="text-xs text-destructive">{errors.assignedTo.message}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
