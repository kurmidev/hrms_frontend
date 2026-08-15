import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { assetApi } from '@/api/asset.api'
import { employeesApi } from '@/api/employees.api'
import type { Employee } from '@/types/employee.types'
import type { Asset } from '@/types/asset.types'
import { toast } from 'sonner'

const schema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  conditionOnIssue: z.string().optional(),
  notes: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: Asset | null
}

export function AssignAssetDialog({ open, onOpenChange, asset }: Props) {
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
  const employeeId = watch('employeeId')

  const { mutate: assign, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      if (!asset) return Promise.reject(new Error('No asset selected'))
      return assetApi.assign(asset.id, {
        employeeId: values.employeeId,
        conditionOnIssue: values.conditionOnIssue || undefined,
        notes: values.notes || undefined,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['asset', asset?.id] })
      onOpenChange(false)
      reset()
      toast.success('Asset assigned.')
    },
    onError: () => toast.error('Failed to assign asset.'),
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
          <DialogTitle>Assign Asset {asset ? `— ${asset.name}` : ''}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => assign(v))} className="space-y-4 py-2">
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
          <div className="space-y-1.5">
            <Label htmlFor="conditionOnIssue">Condition on Issue</Label>
            <Input id="conditionOnIssue" placeholder="e.g. New / Good" {...register('conditionOnIssue')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" {...register('notes')} />
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
