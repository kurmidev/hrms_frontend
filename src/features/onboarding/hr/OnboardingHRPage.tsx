import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, UserCheck, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { onboardingApi } from '@/api/onboarding.api'
import type { OnboardingLink } from '@/types/onboarding.types'
import { ONBOARDING_STATUS_LABELS } from '@/lib/constants'
import { formatDateTime } from '@/lib/utils'
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

export function OnboardingHRPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { page, limit, setPage, reset } = usePagination()
  const canManage = usePermission('onboarding:manage')
  const [open, setOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['onboarding-links', { page, limit, status: statusFilter, email: search }],
    queryFn: () => onboardingApi.list({ page, limit, status: statusFilter || undefined, email: search || undefined }),
    enabled: canManage,
  })

  const { register, handleSubmit, reset: resetForm, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const { mutate: create, isPending } = useMutation({
    mutationFn: onboardingApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['onboarding-links'] })
      setOpen(false)
      resetForm()
      toast.success('Invite link generated and sent.')
    },
    onError: () => toast.error('Failed to create onboarding link.'),
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
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v ?? ''); reset() }}>
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
        onRowClick={(row) => navigate(`/onboarding/${row.id}`)}
        rowKey={(r) => r.id}
        emptyMessage="No onboarding links yet."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Candidate</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => create(v))} className="space-y-4 py-2">
            {[
              { id: 'candidateName', label: 'Full Name *', placeholder: 'Priya Sharma' },
              { id: 'email', label: 'Email *', placeholder: 'priya@example.com' },
              { id: 'phone', label: 'Mobile *', placeholder: '9876543210' },
              { id: 'jobTitle', label: 'Job Title *', placeholder: 'Software Engineer' },
              { id: 'departmentName', label: 'Department *', placeholder: 'Engineering' },
              { id: 'workLocation', label: 'Work Location', placeholder: 'Bangalore, WFH' },
            ].map(({ id, label, placeholder }) => (
              <div key={id} className="space-y-1.5">
                <Label htmlFor={id}>{label}</Label>
                <Input id={id} placeholder={placeholder} {...register(id as keyof FormValues)} />
                {errors[id as keyof FormValues] && (
                  <p className="text-xs text-destructive">{errors[id as keyof FormValues]?.message}</p>
                )}
              </div>
            ))}
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
    </div>
  )
}
