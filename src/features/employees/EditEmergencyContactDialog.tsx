import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { employeesApi } from '@/api/employees.api'
import type { Employee } from '@/types/employee.types'
import { getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().length(10, 'Phone must be exactly 10 digits'),
  relation: z.string().min(1, 'Relation is required'),
  alternatePhone: z.string().optional(),
  address: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee
}

export function EditEmergencyContactDialog({ open, onOpenChange, employee }: Props) {
  const qc = useQueryClient()

  const defaults = (): FormValues => ({
    name: employee.emergencyContact?.name ?? '',
    phone: employee.emergencyContact?.phone ?? '',
    relation: employee.emergencyContact?.relationship ?? '',
    alternatePhone: '',
    address: employee.emergencyContact?.address ?? '',
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: defaults(),
  })

  useEffect(() => {
    if (open) reset(defaults())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employee.id])

  const { mutate: save, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = { ...values, alternatePhone: values.alternatePhone || undefined }
      return employeesApi.updateEmergencyContact(employee.id, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee', employee.id] })
      onOpenChange(false)
      toast.success('Emergency contact updated.')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to update emergency contact.')),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:w-[85vw] lg:w-[70vw] max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Emergency Contact</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save(v))} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Relationship *</Label>
              <Input placeholder="e.g. Spouse" {...register('relation')} />
              {errors.relation && <p className="text-xs text-destructive">{errors.relation.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Alternate Phone</Label>
              <Input {...register('alternatePhone')} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Address</Label>
              <Input {...register('address')} />
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
