import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { onboardingApi } from '@/api/onboarding.api'
import { departmentsApi } from '@/api/departments.api'
import { designationsApi } from '@/api/designations.api'
import { rolesApi } from '@/api/roles.api'
import { payrollStructuresApi } from '@/api/payroll-structures.api'
import { leavePoliciesApi } from '@/api/leave-policies.api'
import { employeesApi } from '@/api/employees.api'
import type { OnboardingLink } from '@/types/onboarding.types'
import type { Department, Designation, Role, PayrollStructure, LeavePolicy } from '@/types/organization.types'
import type { Employee, EmploymentType } from '@/types/employee.types'
import { EMPLOYMENT_TYPE_LABELS } from '@/lib/constants'
import { getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

const schema = z.object({
  departmentId: z.string().min(1, 'Department is required'),
  designationId: z.string().min(1, 'Job title is required'),
  roleIds: z.array(z.string()).min(1, 'Select at least one role'),
  payrollStructureId: z.string().min(1, 'Payroll structure is required'),
  leavePolicyIds: z.array(z.string()).min(1, 'Select at least one leave policy'),
  employmentType: z.string().min(1, 'Employment type is required'),
  joiningDate: z.string().min(1, 'Joining date is required'),
  reportingManagerId: z.string().optional(),
  empCode: z.string().optional(),
  probationEndDate: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const EMPTY_DEFAULTS: FormValues = {
  departmentId: '',
  designationId: '',
  roleIds: [],
  payrollStructureId: '',
  leavePolicyId: '',
  employmentType: '',
  joiningDate: '',
  reportingManagerId: '',
  empCode: '',
  probationEndDate: '',
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  link: OnboardingLink
}

export function ApproveOnboardingDialog({ open, onOpenChange, link }: Props) {
  const qc = useQueryClient()

  const { data: departmentsData } = useQuery({
    queryKey: ['departments', { forApprove: true }],
    queryFn: () => departmentsApi.list({ limit: 100 }),
    enabled: open,
  })
  const departments = (departmentsData as { data?: Department[] })?.data ?? []

  const { data: rolesData } = useQuery({
    queryKey: ['roles', { forApprove: true }],
    queryFn: () => rolesApi.list(),
    enabled: open,
  })
  const roles: Role[] = rolesData ?? []

  const { data: payrollData } = useQuery({
    queryKey: ['payroll-structures', { forApprove: true }],
    queryFn: () => payrollStructuresApi.list({ limit: 100 }),
    enabled: open,
  })
  const payrollStructures = (payrollData as { data?: PayrollStructure[] })?.data ?? []

  const { data: leavePolicyData } = useQuery({
    queryKey: ['leave-policies', { forApprove: true }],
    queryFn: () => leavePoliciesApi.list({ limit: 100, isActive: true }),
    enabled: open,
  })
  const leavePolicies = (leavePolicyData as { data?: LeavePolicy[] })?.data ?? []

  const { data: employeesData } = useQuery({
    queryKey: ['employees', { forApprove: true }],
    queryFn: () => employeesApi.list({ limit: 100 }),
    enabled: open,
  })
  const employees = (employeesData as { data?: Employee[] })?.data ?? []

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: EMPTY_DEFAULTS,
  })

  const departmentId = watch('departmentId')
  const designationId = watch('designationId')
  const roleIds = watch('roleIds')
  const payrollStructureId = watch('payrollStructureId')
  const leavePolicyId = watch('leavePolicyId')
  const employmentType = watch('employmentType')
  const reportingManagerId = watch('reportingManagerId')

  const { data: designationsData } = useQuery({
    queryKey: ['designations-for-department', departmentId],
    queryFn: () => designationsApi.list({ departmentId, limit: 100 }),
    enabled: open && !!departmentId,
  })
  const designations = (designationsData as { data?: Designation[] })?.data ?? []

  // Cascading rule: designation must reset whenever department changes.
  useEffect(() => {
    setValue('designationId', '')
  }, [departmentId, setValue])

  // Best-effort prefill from the onboarding link's free-text fields — HR must
  // still confirm every dropdown, this only seeds initial defaults.
  useEffect(() => {
    if (!open) return
    reset(EMPTY_DEFAULTS)
    if (departments.length === 0) return
    const matchedDept = departments.find((d) => d.name === link.departmentName)
    if (matchedDept) setValue('departmentId', matchedDept.id)
    if (link.prefillEmploymentType) setValue('employmentType', link.prefillEmploymentType)
    if (link.prefillJoiningDate) setValue('joiningDate', link.prefillJoiningDate.slice(0, 10))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, departments.length])

  // Match job title against the newly-loaded designation list for the matched department.
  useEffect(() => {
    if (!link.jobTitle || designations.length === 0) return
    const matchedDesignation = designations.find((d) => d.name === link.jobTitle)
    if (matchedDesignation) setValue('designationId', matchedDesignation.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [designations.length])

  const toggleRole = (roleId: string) => {
    const current = roleIds ?? []
    const next = current.includes(roleId) ? current.filter((r) => r !== roleId) : [...current, roleId]
    setValue('roleIds', next, { shouldValidate: true })
  }

  const { mutate: approve, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      onboardingApi.approve(link.id, {
        departmentId: values.departmentId,
        designationId: values.designationId,
        roleIds: values.roleIds,
        payrollStructureId: values.payrollStructureId,
        leavePolicyId: values.leavePolicyId,
        employmentType: values.employmentType,
        joiningDate: values.joiningDate,
        reportingManagerId: values.reportingManagerId || undefined,
        empCode: values.empCode || undefined,
        probationEndDate: values.probationEndDate || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-link', link.id] })
      onOpenChange(false)
      toast.success('Employee account created — welcome email sent.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to approve and activate candidate.')),
  })

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(EMPTY_DEFAULTS) }}>
      <DialogContent className="w-[92vw] sm:w-[85vw] lg:w-[75vw] max-w-4xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Approve &amp; Activate — {link.candidateName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => approve(v))} className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Department *</Label>
              <Select
                items={Object.fromEntries(departments.map((d) => [d.id, d.name]))}
                value={departmentId}
                onValueChange={(v) => setValue('departmentId', v ?? '', { shouldValidate: true })}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {departments.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentId && <p className="text-xs text-destructive">{errors.departmentId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Job Title *</Label>
              <Select
                items={Object.fromEntries(designations.map((d) => [d.id, d.name]))}
                value={designationId}
                onValueChange={(v) => setValue('designationId', v ?? '', { shouldValidate: true })}
                disabled={!departmentId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={departmentId ? 'Select job title' : 'Select department first'} />
                </SelectTrigger>
                <SelectContent>
                  {designations.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.designationId && <p className="text-xs text-destructive">{errors.designationId.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Employment Type *</Label>
              <Select
                items={EMPLOYMENT_TYPE_LABELS}
                value={employmentType}
                onValueChange={(v) => setValue('employmentType', (v ?? '') as EmploymentType | '', { shouldValidate: true })}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(EMPLOYMENT_TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.employmentType && <p className="text-xs text-destructive">{errors.employmentType.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="joiningDate">Joining Date *</Label>
              <Input id="joiningDate" type="date" {...register('joiningDate')} />
              {errors.joiningDate && <p className="text-xs text-destructive">{errors.joiningDate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Payroll Structure *</Label>
              <Select
                items={Object.fromEntries(payrollStructures.map((p) => [p.id, p.name]))}
                value={payrollStructureId}
                onValueChange={(v) => setValue('payrollStructureId', v ?? '', { shouldValidate: true })}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select payroll structure" /></SelectTrigger>
                <SelectContent>
                  {payrollStructures.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.payrollStructureId && <p className="text-xs text-destructive">{errors.payrollStructureId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Leave Policy *</Label>
              <Select
                items={Object.fromEntries(leavePolicies.map((p) => [p.id, p.name]))}
                value={leavePolicyId}
                onValueChange={(v) => setValue('leavePolicyId', v ?? '', { shouldValidate: true })}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select leave policy" /></SelectTrigger>
                <SelectContent>
                  {leavePolicies.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.leavePolicyId && <p className="text-xs text-destructive">{errors.leavePolicyId.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Reporting Manager</Label>
            <Select
              items={{ '': 'None', ...Object.fromEntries(employees.map((e) => [e.id, `${e.firstName} ${e.lastName} (${e.empCode})`])) }}
              value={reportingManagerId ?? ''}
              onValueChange={(v) => setValue('reportingManagerId', v ?? '')}
            >
              <SelectTrigger className="w-full"><SelectValue placeholder="None" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">None</SelectItem>
                {employees.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.empCode})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="empCode">Employee Code</Label>
              <Input id="empCode" placeholder="Auto-generated if left blank" {...register('empCode')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="probationEndDate">Probation End Date</Label>
              <Input id="probationEndDate" type="date" {...register('probationEndDate')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Roles *</Label>
            <div className="rounded-md border border-border max-h-40 overflow-y-auto p-2 space-y-1.5">
              {roles.map((r) => (
                <label key={r.id} className="flex items-center gap-2 py-0.5 cursor-pointer">
                  <Checkbox
                    checked={roleIds?.includes(r.id) ?? false}
                    onCheckedChange={() => toggleRole(r.id)}
                  />
                  <span className="text-sm text-foreground">{r.name}</span>
                </label>
              ))}
              {roles.length === 0 && <p className="text-xs text-muted-foreground py-1">No roles found.</p>}
            </div>
            {errors.roleIds && <p className="text-xs text-destructive">{errors.roleIds.message}</p>}
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Approve &amp; Activate
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
