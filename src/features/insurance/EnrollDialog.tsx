import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { insuranceApi } from '@/api/insurance.api'
import { employeesApi } from '@/api/employees.api'
import type { Employee } from '@/types/employee.types'
import type { InsurancePolicy } from '@/types/insurance.types'
import { toast } from 'sonner'

const schema = z.object({
  employeeId: z.string().min(1, 'Employee is required'),
  policyId: z.string().min(1, 'Policy is required'),
  familyMembers: z.array(
    z.object({
      name: z.string().min(1, 'Required'),
      relation: z.string().min(1, 'Required'),
      dateOfBirth: z.string().min(1, 'Required'),
    })
  ),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EnrollDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient()

  const { data: employeesData } = useQuery({
    queryKey: ['employees', { forSelect: true }],
    queryFn: () => employeesApi.list({ limit: 100 }),
    enabled: open,
  })
  const employees = (employeesData as { data?: Employee[] })?.data ?? []

  const { data: policiesData } = useQuery({
    queryKey: ['insurance-policies', { forSelect: true }],
    queryFn: () => insuranceApi.listPolicies({ limit: 100 }),
    enabled: open,
  })
  const policies = (policiesData as { data?: InsurancePolicy[] })?.data ?? []

  const { register, control, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { familyMembers: [] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'familyMembers' })
  const employeeId = watch('employeeId')
  const policyId = watch('policyId')

  const { mutate: enroll, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      insuranceApi.enroll({
        employeeId: values.employeeId,
        policyId: values.policyId,
        familyMembers: values.familyMembers.length ? values.familyMembers : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['insurance-enrollments'] })
      onOpenChange(false)
      reset({ familyMembers: [] })
      toast.success('Employee enrolled.')
    },
    onError: () => toast.error('Failed to enroll employee.'),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset({ familyMembers: [] })
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Enroll in Insurance</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => enroll(v))} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Employee *</Label>
              <Select
                items={Object.fromEntries(employees.map((e) => [e.id, `${e.firstName} ${e.lastName} (${e.empCode})`]))}
                value={employeeId ?? ''}
                onValueChange={(v) => setValue('employeeId', v ?? '')}
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
              {errors.employeeId && <p className="text-xs text-destructive">{errors.employeeId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Policy *</Label>
              <Select
                items={Object.fromEntries(policies.map((p) => [p.id, p.name]))}
                value={policyId ?? ''}
                onValueChange={(v) => setValue('policyId', v ?? '')}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select policy" /></SelectTrigger>
                <SelectContent>
                  {policies.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.policyId && <p className="text-xs text-destructive">{errors.policyId.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Family Members</Label>
              <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', relation: '', dateOfBirth: '' })}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>
            {fields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-end">
                <div className="space-y-1">
                  <Label className="text-xs">Name</Label>
                  <Input {...register(`familyMembers.${index}.name`)} />
                  {errors.familyMembers?.[index]?.name && (
                    <p className="text-xs text-destructive">{errors.familyMembers[index]?.name?.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Relation</Label>
                  <Input {...register(`familyMembers.${index}.relation`)} />
                  {errors.familyMembers?.[index]?.relation && (
                    <p className="text-xs text-destructive">{errors.familyMembers[index]?.relation?.message}</p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Date of Birth</Label>
                  <Input type="date" {...register(`familyMembers.${index}.dateOfBirth`)} />
                  {errors.familyMembers?.[index]?.dateOfBirth && (
                    <p className="text-xs text-destructive">{errors.familyMembers[index]?.dateOfBirth?.message}</p>
                  )}
                </div>
                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </div>
            ))}
            {fields.length === 0 && <p className="text-xs text-muted-foreground">No family members added.</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enroll
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
