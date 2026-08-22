import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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
import { departmentsApi } from '@/api/departments.api'
import { designationsApi } from '@/api/designations.api'
import { leavePoliciesApi } from '@/api/leave-policies.api'
import { zonesApi } from '@/api/zones.api'
import type { Employee } from '@/types/employee.types'
import type { Department, Designation, LeavePolicy } from '@/types/organization.types'
import type { Zone } from '@/types/zone.types'
import { EMPLOYMENT_TYPE_LABELS } from '@/lib/constants'
import { getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

const EMPLOYMENT_TYPES = ['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN'] as const
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
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'Phone must be 10 digits').max(10),
  departmentId: z.string().min(1, 'Required'),
  designationId: z.string().min(1, 'Required'),
  payrollStructureId: z.string().min(1, 'Required'),
  leavePolicyId: z.string().min(1, 'Required'),
  employmentType: z.string().min(1, 'Required'),
  joiningDate: z.string().min(1, 'Required'),
  probationEndDate: z.string().optional(),
  zoneId: z.string().optional(),
  workLocation: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  nationality: z.string().optional(),
  bloodGroup: z.string().optional(),
  pfNumber: z.string().optional(),
  esiNumber: z.string().optional(),
  uanNumber: z.string().optional(),
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
    firstName: emp.firstName,
    lastName: emp.lastName,
    email: emp.email,
    phone: emp.phone,
    departmentId: emp.departmentId ?? '',
    designationId: emp.designationId ?? '',
    payrollStructureId: emp.payrollStructureId ?? '',
    leavePolicyId: emp.leavePolicyId ?? '',
    employmentType: emp.employmentType,
    joiningDate: emp.joiningDate?.slice(0, 10) ?? '',
    probationEndDate: emp.probationEndDate?.slice(0, 10) ?? '',
    zoneId: emp.zoneId ?? '',
    workLocation: emp.workLocation ?? '',
    dateOfBirth: emp.dateOfBirth?.slice(0, 10) ?? '',
    gender: emp.gender ?? '',
    nationality: emp.nationality ?? '',
    bloodGroup: emp.bloodGroup ?? '',
    pfNumber: emp.pfNumber ?? '',
    esiNumber: emp.esiNumber ?? '',
    uanNumber: emp.uanNumber ?? '',
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
 * Comprehensive admin edit form (PUT /employees/:id, requires employee:update).
 * Grouped into fieldsets matching the profile page's tab layout — Employment
 * (the 5 admin-only fields), Personal, Address, and Health/References —
 * rather than one flat field list. payrollStructureId is intentionally NOT
 * editable here: "Change Payroll Structure" already has its own dedicated
 * dialog/flow on the profile page, so this form leaves it untouched to avoid
 * two competing UIs for the same field.
 */
export function EditEmployeeDialog({ open, onOpenChange, employee }: Props) {
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

  const { data: deptData } = useQuery({
    queryKey: ['departments-for-select'],
    queryFn: () => departmentsApi.list({ limit: 100 }),
    enabled: open,
  })
  const departments = (deptData as { data?: Department[] })?.data ?? []

  const { data: desigData } = useQuery({
    queryKey: ['designations-for-select'],
    queryFn: () => designationsApi.list({ limit: 100 }),
    enabled: open,
  })
  const designations = (desigData as { data?: Designation[] })?.data ?? []

  const { data: policyData } = useQuery({
    queryKey: ['leave-policies-for-select'],
    queryFn: () => leavePoliciesApi.list({ limit: 100 }),
    enabled: open,
  })
  const leavePolicies = (policyData as { data?: LeavePolicy[] })?.data ?? []

  const { data: zoneData } = useQuery({
    queryKey: ['zones-for-select'],
    queryFn: () => zonesApi.list({ limit: 100 }),
    enabled: open,
  })
  const zones = (zoneData as { data?: Zone[] })?.data ?? []

  const { mutate: save, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      const { healthInfoNotes, ...rest } = values
      return employeesApi.update(employee.id, {
        ...rest,
        employmentType: rest.employmentType as Employee['employmentType'],
        gender: rest.gender ? (rest.gender as NonNullable<Employee['gender']>) : undefined,
        probationEndDate: rest.probationEndDate || undefined,
        zoneId: rest.zoneId || undefined,
        healthInfo: healthInfoNotes ? { notes: healthInfoNotes } : undefined,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['employee', employee.id] })
      qc.invalidateQueries({ queryKey: ['employees'] })
      onOpenChange(false)
      toast.success('Employee updated.')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to update employee.')),
  })

  const employmentType = watch('employmentType')
  const gender = watch('gender')
  const departmentId = watch('departmentId')
  const designationId = watch('designationId')
  const leavePolicyId = watch('leavePolicyId')
  const zoneId = watch('zoneId')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:w-[85vw] lg:w-[70vw] max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Employee</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save(v))} className="space-y-6 py-2">
          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Employment</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Department *</Label>
                <Select
                  items={Object.fromEntries(departments.map((d) => [d.id, d.name]))}
                  value={departmentId ?? ''}
                  onValueChange={(v) => setValue('departmentId', v ?? '')}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.departmentId && <p className="text-xs text-destructive">{errors.departmentId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Designation *</Label>
                <Select
                  items={Object.fromEntries(designations.map((d) => [d.id, d.name]))}
                  value={designationId ?? ''}
                  onValueChange={(v) => setValue('designationId', v ?? '')}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select designation" /></SelectTrigger>
                  <SelectContent>
                    {designations.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.designationId && <p className="text-xs text-destructive">{errors.designationId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Leave Policy *</Label>
                <Select
                  items={Object.fromEntries(leavePolicies.map((p) => [p.id, p.name]))}
                  value={leavePolicyId ?? ''}
                  onValueChange={(v) => setValue('leavePolicyId', v ?? '')}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select leave policy" /></SelectTrigger>
                  <SelectContent>
                    {leavePolicies.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.leavePolicyId && <p className="text-xs text-destructive">{errors.leavePolicyId.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Employment Type *</Label>
                <Select
                  items={Object.fromEntries(EMPLOYMENT_TYPES.map((t) => [t, EMPLOYMENT_TYPE_LABELS[t]]))}
                  value={employmentType ?? ''}
                  onValueChange={(v) => setValue('employmentType', v ?? '')}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{EMPLOYMENT_TYPE_LABELS[t]}</SelectItem>)}
                  </SelectContent>
                </Select>
                {errors.employmentType && <p className="text-xs text-destructive">{errors.employmentType.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Zone</Label>
                <Select
                  items={Object.fromEntries(zones.map((z) => [z.id, z.name]))}
                  value={zoneId ?? ''}
                  onValueChange={(v) => setValue('zoneId', v ?? '')}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select zone" /></SelectTrigger>
                  <SelectContent>
                    {zones.map((z) => <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Work Location</Label>
                <Input placeholder="e.g. Mumbai HO" {...register('workLocation')} />
              </div>
              <div className="space-y-1.5">
                <Label>Joining Date *</Label>
                <Input type="date" {...register('joiningDate')} />
                {errors.joiningDate && <p className="text-xs text-destructive">{errors.joiningDate.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Probation End Date</Label>
                <Input type="date" {...register('probationEndDate')} />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Personal</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>First Name *</Label>
                <Input {...register('firstName')} />
                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Last Name *</Label>
                <Input {...register('lastName')} />
                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Phone *</Label>
                <Input {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
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
                <Label>PF Number</Label>
                <Input {...register('pfNumber')} />
              </div>
              <div className="space-y-1.5">
                <Label>ESI Number</Label>
                <Input {...register('esiNumber')} />
              </div>
              <div className="space-y-1.5">
                <Label>UAN Number</Label>
                <Input {...register('uanNumber')} />
              </div>
            </div>
          </section>

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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => prevFields.append({})}
              >
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
