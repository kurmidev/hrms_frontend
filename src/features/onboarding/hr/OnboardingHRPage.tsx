import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, UserCheck, Loader2, Search, Copy, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { onboardingApi } from '@/api/onboarding.api'
import { departmentsApi } from '@/api/departments.api'
import { designationsApi } from '@/api/designations.api'
import type { OnboardingLink } from '@/types/onboarding.types'
import type { Designation } from '@/types/organization.types'
import { ONBOARDING_STATUS_LABELS } from '@/lib/constants'
import { formatDateTime, getApiErrorMessage } from '@/lib/utils'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('Valid email required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, '10-digit mobile number'),
  candidateName: z.string().min(1, 'Name is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  departmentName: z.string().min(1, 'Department name is required'),
  workLocation: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const RESENDABLE_STATUSES = new Set(['PENDING', 'IN_PROGRESS', 'CHANGES_REQUESTED'])

function buildOnboardingLink(token: string): string {
  return `${window.location.origin}/onboarding/${token}`
}

async function copyLink(token: string) {
  try {
    await navigator.clipboard.writeText(buildOnboardingLink(token))
    toast.success('Link copied.')
  } catch {
    toast.error('Failed to copy link.')
  }
}

export function OnboardingHRPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { page, limit, setPage, reset } = usePagination()
  const canManage = usePermission('onboarding:manage')
  const [open, setOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [createdLink, setCreatedLink] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding-links', { page, limit, status: statusFilter, email: search }],
    queryFn: () => onboardingApi.list({ page, limit, status: statusFilter || undefined, email: search || undefined }),
    enabled: canManage,
  })

  const { data: deptTree = [] } = useQuery({
    queryKey: ['departments-tree'],
    queryFn: departmentsApi.tree,
    enabled: canManage,
  })

  const { register, handleSubmit, setValue, watch, reset: resetForm, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    // Explicit string defaults (not undefined) so the Department/Job Title
    // Select components stay controlled from the first render — an
    // undefined -> defined transition mid-lifecycle trips Base UI's
    // "uncontrolled to controlled" warning and risks losing the open/closed
    // state of the popup (see docs/known-issues.md 2026-08-20 onboarding entry).
    defaultValues: {
      email: '',
      phone: '',
      candidateName: '',
      jobTitle: '',
      departmentName: '',
      workLocation: '',
    },
  })

  const selectedDepartmentName = watch('departmentName')

  const flatDepts = (nodes: typeof deptTree): { id: string; name: string }[] =>
    nodes.flatMap((n) => [{ id: n.id, name: n.name }, ...flatDepts(n.children)])

  const selectedDeptId = flatDepts(deptTree).find((d) => d.name === selectedDepartmentName)?.id ?? ''

  const { data: designationsData } = useQuery({
    queryKey: ['designations-for-department', selectedDeptId],
    queryFn: () => designationsApi.list({ departmentId: selectedDeptId, limit: 100 }),
    enabled: canManage && !!selectedDeptId,
  })
  const designations: Designation[] = (designationsData as { data?: Designation[] })?.data ?? []

  useEffect(() => {
    setValue('jobTitle', '')
  }, [selectedDepartmentName, setValue])

  const { mutate: create, isPending } = useMutation({
    mutationFn: onboardingApi.create,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['onboarding-links'] })
      setOpen(false)
      resetForm()
      const link = created as { token?: string }
      if (link.token) setCreatedLink(buildOnboardingLink(link.token))
      toast.success('Invite link generated and sent.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to create onboarding link.')),
  })

  const { mutate: resend } = useMutation({
    mutationFn: (id: string) => onboardingApi.resend(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-links'] })
      toast.success('Invite resent.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to resend invite.')),
  })

  const links: OnboardingLink[] = (data as { data?: OnboardingLink[] })?.data ?? []
  const meta = (data as { meta?: { total: number; page: number; limit: number; totalPages: number } })?.meta

  const columns: Column<OnboardingLink>[] = [
    {
      key: 'candidateName',
      header: 'Candidate',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-foreground">{row.candidateName}</p>
          <p className="text-xs text-muted-foreground">{row.email}</p>
        </div>
      ),
    },
    { key: 'jobTitle', header: 'Job Title', render: (row) => row.jobTitle ?? '—' },
    { key: 'departmentName', header: 'Department', render: (row) => row.departmentName ?? '—' },
    { key: 'status', header: 'Status', render: (row) => <StatusBadge status={row.status} type="onboarding" /> },
    { key: 'expiresAt', header: 'Expires', render: (row) => formatDateTime(row.expiresAt) },
    {
      key: 'actions',
      header: '',
      className: 'w-24 text-right',
      render: (row) => (
        <div className="flex gap-1 justify-end">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            title="Copy onboarding link"
            onClick={(e) => { e.stopPropagation(); copyLink(row.token) }}
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          {RESENDABLE_STATUSES.has(row.status) && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              title="Resend invite"
              onClick={(e) => { e.stopPropagation(); resend(row.id) }}
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  if (!canManage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Onboarding</h1>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          You do not have permission to manage onboarding.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <UserCheck className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Onboarding</h1>
            <p className="text-sm text-muted-foreground">Manage candidate invitations</p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setOpen(true) }} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Invite Candidate
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); reset() }}
            className="pl-9 w-56"
          />
        </div>
        <Select
          items={{ '': 'All Statuses', ...ONBOARDING_STATUS_LABELS }}
          value={statusFilter}
          onValueChange={(v) => { setStatusFilter(v ?? ''); reset() }}
        >
          <SelectTrigger className="w-48"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {Object.entries(ONBOARDING_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={links}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/onboarding/invites/${row.id}`)}
        rowKey={(r) => r.id}
        emptyMessage="No onboarding links yet."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[92vw] sm:w-[85vw] lg:w-[70vw] max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invite Candidate</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => create(v))} className="space-y-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="candidateName">Full Name *</Label>
                <Input id="candidateName" placeholder="Priya Sharma" {...register('candidateName')} />
                {errors.candidateName && <p className="text-xs text-destructive">{errors.candidateName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" placeholder="priya@example.com" {...register('email')} />
                {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="phone">Mobile *</Label>
                <Input id="phone" placeholder="9876543210" {...register('phone')} />
                {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="workLocation">Work Location</Label>
                <Input id="workLocation" placeholder="Bangalore, WFH" {...register('workLocation')} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Department *</Label>
                <Select
                  items={Object.fromEntries(flatDepts(deptTree).map((d) => [d.name, d.name]))}
                  value={selectedDepartmentName}
                  onValueChange={(v) => setValue('departmentName', v ?? '', { shouldValidate: true })}
                >
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {flatDepts(deptTree).map((d) => (
                      <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.departmentName && <p className="text-xs text-destructive">{errors.departmentName.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label>Job Title *</Label>
                <Select
                  items={Object.fromEntries(designations.map((d) => [d.name, d.name]))}
                  value={watch('jobTitle')}
                  onValueChange={(v) => setValue('jobTitle', v ?? '', { shouldValidate: true })}
                  disabled={!selectedDeptId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={selectedDeptId ? 'Select job title' : 'Select department first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {designations.map((d) => (
                      <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.jobTitle && <p className="text-xs text-destructive">{errors.jobTitle.message}</p>}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Invite
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!createdLink} onOpenChange={(o) => !o && setCreatedLink(null)}>
        <DialogContent className="w-[92vw] sm:w-[85vw] max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invite Link Generated</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Share this link with the candidate, or use the copy action from the list any time.
            </p>
            <div className="flex items-center gap-2">
              <Input readOnly value={createdLink ?? ''} className="text-xs" />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={async () => {
                  if (!createdLink) return
                  await navigator.clipboard.writeText(createdLink)
                  toast.success('Link copied.')
                }}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setCreatedLink(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
