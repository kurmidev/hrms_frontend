import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { HeartPulse, Plus, Check, X, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { insuranceApi } from '@/api/insurance.api'
import type { InsurancePolicy, EmployeeInsurance } from '@/types/insurance.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/store/auth.store'
import { formatCurrency, formatDate, getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'
import { PolicyFormDialog } from './PolicyFormDialog'
import { EnrollDialog } from './EnrollDialog'

const APPROVAL_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
}

export function InsurancePage() {
  const qc = useQueryClient()
  const canManage = usePermission('employee:update')
  const currentEmployeeId = useAuthStore((s) => s.user?.employee?.id) ?? null

  const policyPagination = usePagination()
  const enrollmentPagination = usePagination()

  const [policyFormOpen, setPolicyFormOpen] = useState(false)
  const [editPolicy, setEditPolicy] = useState<InsurancePolicy | null>(null)
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<EmployeeInsurance | null>(null)

  const { data: policyData, isLoading: policiesLoading } = useQuery({
    queryKey: ['insurance-policies', { page: policyPagination.page, limit: policyPagination.limit }],
    queryFn: () => insuranceApi.listPolicies({ page: policyPagination.page, limit: policyPagination.limit }),
  })
  const policies = (policyData as { data?: InsurancePolicy[] })?.data ?? []
  const policyMeta = (policyData as { meta?: PaginatedMeta })?.meta

  const { data: enrollmentData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ['insurance-enrollments', { page: enrollmentPagination.page, limit: enrollmentPagination.limit }],
    queryFn: () => insuranceApi.listEnrollments({ page: enrollmentPagination.page, limit: enrollmentPagination.limit }),
  })
  const enrollments = (enrollmentData as { data?: EmployeeInsurance[] })?.data ?? []
  const enrollmentMeta = (enrollmentData as { meta?: PaginatedMeta })?.meta

  const { mutate: approve } = useMutation({
    mutationFn: (id: string) => insuranceApi.approveEnrollment(id, { approvalStatus: 'APPROVED' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['insurance-enrollments'] })
      toast.success('Enrollment approved.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to approve enrollment.')),
  })

  const { mutate: reject, isPending: rejecting } = useMutation({
    mutationFn: (id: string) => insuranceApi.approveEnrollment(id, { approvalStatus: 'REJECTED' }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['insurance-enrollments'] })
      setRejectTarget(null)
      toast.success('Enrollment rejected.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to reject enrollment.')),
  })

  const policyColumns: Column<InsurancePolicy>[] = [
    { key: 'name', header: 'Name', render: (row) => row.name },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <Badge className="border-0 text-xs font-medium bg-blue-100 text-blue-700" variant="secondary">{row.type}</Badge>
      ),
    },
    { key: 'provider', header: 'Provider', render: (row) => row.provider },
    { key: 'coverageAmount', header: 'Coverage', render: (row) => formatCurrency(row.coverageAmount) },
    { key: 'premium', header: 'Premium', render: (row) => formatCurrency(row.premium) },
    {
      key: 'validity',
      header: 'Validity',
      render: (row) => (row.validFrom && row.validTo ? `${formatDate(row.validFrom)} – ${formatDate(row.validTo)}` : '—'),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <Badge
          className={`border-0 text-xs font-medium ${row.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}
          variant="secondary"
        >
          {row.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      render: (row) =>
        canManage ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              setEditPolicy(row)
              setPolicyFormOpen(true)
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        ) : null,
    },
  ]

  const enrollmentColumns: Column<EmployeeInsurance>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-foreground">{row.employee.firstName} {row.employee.lastName}</p>
          <p className="text-xs text-muted-foreground">{row.employee.empCode}</p>
        </div>
      ),
    },
    { key: 'policy', header: 'Policy', render: (row) => row.policy?.name ?? '—' },
    {
      key: 'statutory',
      header: 'PF / ESI / UAN',
      render: (row) => (
        <div className="text-xs text-muted-foreground space-y-0.5">
          <p>PF: {row.employee.pfNumber ?? '—'}</p>
          <p>ESI: {row.employee.esiNumber ?? '—'}</p>
          <p>UAN: {row.employee.uanNumber ?? '—'}</p>
        </div>
      ),
    },
    {
      key: 'familyMembers',
      header: 'Family Members',
      render: (row) => (row.familyMembers?.length ? row.familyMembers.length : 0),
    },
    {
      key: 'approvalStatus',
      header: 'Approval',
      render: (row) => (
        <Badge className={`border-0 text-xs font-medium ${APPROVAL_COLORS[row.approvalStatus]}`} variant="secondary">
          {row.approvalStatus}
        </Badge>
      ),
    },
    { key: 'enrolledAt', header: 'Enrolled', render: (row) => formatDate(row.enrolledAt) },
    {
      key: 'actions',
      header: '',
      render: (row) =>
        canManage &&
        row.approvalStatus === 'PENDING' &&
        !(currentEmployeeId != null && row.employeeId === currentEmployeeId) ? (
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                approve(row.id)
              }}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                setRejectTarget(row)
              }}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Reject
            </Button>
          </div>
        ) : null,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
          <HeartPulse className="h-5 w-5 text-pink-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Insurance</h1>
          <p className="text-sm text-muted-foreground">Policies and employee enrollments</p>
        </div>
      </div>

      <Tabs defaultValue="policies">
        <TabsList>
          <TabsTrigger value="policies">Policies</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>

        <TabsContent value="policies" className="space-y-4 pt-4">
          <div className="flex items-center justify-end">
            {canManage && (
              <Button
                size="sm"
                onClick={() => {
                  setEditPolicy(null)
                  setPolicyFormOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add Policy
              </Button>
            )}
          </div>
          <DataTable
            columns={policyColumns}
            data={policies}
            isLoading={policiesLoading}
            pagination={policyMeta}
            onPageChange={policyPagination.setPage}
            rowKey={(r) => r.id}
            emptyMessage="No insurance policies found."
          />
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-4 pt-4">
          <div className="flex items-center justify-end">
            {canManage && (
              <Button size="sm" onClick={() => setEnrollOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                Enroll
              </Button>
            )}
          </div>
          <DataTable
            columns={enrollmentColumns}
            data={enrollments}
            isLoading={enrollmentsLoading}
            pagination={enrollmentMeta}
            onPageChange={enrollmentPagination.setPage}
            rowKey={(r) => r.id}
            emptyMessage="No enrollments found."
          />
        </TabsContent>
      </Tabs>

      {canManage && (
        <PolicyFormDialog
          open={policyFormOpen}
          onOpenChange={(o) => {
            setPolicyFormOpen(o)
            if (!o) setEditPolicy(null)
          }}
          policy={editPolicy}
        />
      )}
      {canManage && <EnrollDialog open={enrollOpen} onOpenChange={setEnrollOpen} />}

      <ConfirmDialog
        open={!!rejectTarget}
        onOpenChange={(o) => !o && setRejectTarget(null)}
        title="Reject Enrollment"
        description={`Reject the insurance enrollment for ${rejectTarget ? `${rejectTarget.employee.firstName} ${rejectTarget.employee.lastName}` : ''}?`}
        confirmLabel={rejecting ? 'Rejecting…' : 'Reject'}
        variant="destructive"
        onConfirm={() => rejectTarget && reject(rejectTarget.id)}
      />
    </div>
  )
}
