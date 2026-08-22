import { useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { employeesApi } from '@/api/employees.api'
import type { Employee } from '@/types/employee.types'
import { getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const

const addressSchema = z.object({
  line1: z.string().optional(),
  line2: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
})

const previousEmploymentSchema = z.object({
  lastEmployerName: z.string().optional(),
  jobTitleAtLastEmployer: z.string().optional(),
  employmentFrom: z.string().optional(),
  employmentTo: z.string().optional(),
  lastManagerName: z.string().optional(),
  lastManagerContact: z.string().optional(),
  hrContactAtPreviousEmployer: z.string().optional(),
  reasonForLeaving: z.string().optional(),
})

const referenceContactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  contact: z.string().min(1, 'Contact is required'),
})

const schema = z.object({
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  bloodGroup: z.string().optional(),
  phone: z.string().min(10, 'Phone must be 10 digits').max(10),
  email: z.string().email('Invalid email'),
  healthInfoNotes: z.string().optional(),
  address: addressSchema,
  previousEmployment: z.array(previousEmploymentSchema),
  referenceContacts: z.array(referenceContactSchema),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  employee: Employee
}

function toFormValues(emp: Employee): FormValues {
  return {
    dateOfBirth: emp.dateOfBirth?.slice(0, 10) ?? '',
    gender: emp.gender ?? '',
    nationality: emp.nationality ?? '',
    bloodGroup: emp.bloodGroup ?? '',
    phone: emp.phone,
    email: emp.email,
    healthInfoNotes: typeof emp.healthInfo?.notes === 'string' ? (emp.healthInfo.notes as string) : '',
    address: {
      line1: emp.address?.line1 ?? '',
      line2: emp.address?.line2 ?? '',
      city: emp.address?.city ?? '',
      state: emp.address?.state ?? '',
      pincode: emp.address?.pincode ?? '',
    },
    previousEmployment: emp.previousEmployment ?? [],
    referenceContacts: emp.referenceContacts ?? [],
  }
}

/**
 * Self-service edit for the Personal tab — PATCH /employees/:id/self,
 * requires profile:update. Only reachable when the viewer is looking at
 * their own profile (gated by the caller); the backend also 403s any
 * cross-employee attempt regardless.
 */
export function EditPersonalDialog({ open, onOpenChange, employee }: Props) {
  const qc = useQueryClient()

  const { register, control, handleSubmit, setValue, watch, reset, formState: { errors } } =
    useForm<FormValues>({
      resolver: zodResolver(schema) as Resolver<FormValues>,
      defaultValues: toFormValues(employee),
    })

  const prevFields = useFieldArray({ control, name: 'previousEmployment' })
  const refFields = useFieldArray({ control, name: 'referenceContacts' })

  useEffect(() => {
    if (open) reset(toFormValues(employee))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, employee.id])

  const { mutate: save, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      const { healthInfoNotes, ...rest } = values
      return employeesApi.updateSelf(employee.id, {
        ...rest,
        gender: rest.gender ? (rest.gender as NonNullable<Employee['gender']>) : undefined,
        healthInfo: healthInfoNotes ? { notes: healthInfoNotes } : undefined,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee', employee.id] })
      onOpenChange(false)
      toast.success('Personal details updated.')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to update personal details.')),
  })

  const gender = watch('gender')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:w-[85vw] lg:w-[70vw] max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Personal Information</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save(v))} className="space-y-6 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Date of Birth</Label>
              <Input type="date" {...register('dateOfBirth')} />
            </div>
            <div className="space-y-1.5">
              <Label>Gender</Label>
              <Select
                items={Object.fromEntries(GENDERS.map((g) => [g, g.charAt(0) + g.slice(1).toLowerCase()]))}
                value={gender ?? ''}
                onValueChange={(v) => setValue('gender', v ?? '')}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select gender" /></SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => <SelectItem key={g} value={g}>{g.charAt(0) + g.slice(1).toLowerCase()}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Nationality</Label>
              <Input {...register('nationality')} />
            </div>
            <div className="space-y-1.5">
              <Label>Blood Group</Label>
              <Input placeholder="e.g. O+" {...register('bloodGroup')} />
            </div>
            <div className="space-y-1.5">
              <Label>Phone *</Label>
              <Input {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Personal Email *</Label>
              <Input type="email" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Address Line 1</Label>
                <Input {...register('address.line1')} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Address Line 2</Label>
                <Input {...register('address.line2')} />
              </div>
              <div className="space-y-1.5">
                <Label>City</Label>
                <Input {...register('address.city')} />
              </div>
              <div className="space-y-1.5">
                <Label>State</Label>
                <Input {...register('address.state')} />
              </div>
              <div className="space-y-1.5">
                <Label>Pincode</Label>
                <Input {...register('address.pincode')} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Health Info</h3>
            <Textarea placeholder="Any relevant health notes…" {...register('healthInfoNotes')} />
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Previous Employment</h3>
              <Button type="button" variant="outline" size="sm" onClick={() => prevFields.append({})}>
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>
            {prevFields.fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border border-border p-3 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input placeholder="Last employer" {...register(`previousEmployment.${index}.lastEmployerName`)} />
                  <Input placeholder="Job title" {...register(`previousEmployment.${index}.jobTitleAtLastEmployer`)} />
                  <Input type="date" placeholder="From" {...register(`previousEmployment.${index}.employmentFrom`)} />
                  <Input type="date" placeholder="To" {...register(`previousEmployment.${index}.employmentTo`)} />
                  <Input placeholder="Manager name" {...register(`previousEmployment.${index}.lastManagerName`)} />
                  <Input placeholder="Manager contact" {...register(`previousEmployment.${index}.lastManagerContact`)} />
                  <Input placeholder="HR contact" {...register(`previousEmployment.${index}.hrContactAtPreviousEmployer`)} />
                  <Input placeholder="Reason for leaving" {...register(`previousEmployment.${index}.reasonForLeaving`)} />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => prevFields.remove(index)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1 text-destructive" /> Remove
                </Button>
              </div>
            ))}
          </section>

          <section className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Reference Contacts</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refFields.append({ name: '', contact: '' })}
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </div>
            {refFields.fields.map((field, index) => (
              <div key={field.id} className="rounded-lg border border-border p-3 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-2 sm:items-end">
                  <div className="space-y-1">
                    <Input placeholder="Name" {...register(`referenceContacts.${index}.name`)} />
                    {errors.referenceContacts?.[index]?.name && (
                      <p className="text-xs text-destructive">{errors.referenceContacts[index]?.name?.message}</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <Input placeholder="Contact" {...register(`referenceContacts.${index}.contact`)} />
                    {errors.referenceContacts?.[index]?.contact && (
                      <p className="text-xs text-destructive">{errors.referenceContacts[index]?.contact?.message}</p>
                    )}
                  </div>
                  <Button type="button" variant="ghost" size="icon" onClick={() => refFields.remove(index)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </section>

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
