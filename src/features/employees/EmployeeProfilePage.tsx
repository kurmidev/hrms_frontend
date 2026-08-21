import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase, Users, Wallet, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { employeesApi } from '@/api/employees.api'
import { rolesApi } from '@/api/roles.api'
import { EMPLOYMENT_TYPE_LABELS } from '@/lib/constants'
import { formatDate, getInitials } from '@/lib/utils'
import { usePermission } from '@/hooks/usePermission'
import { ChangePayrollStructureDialog } from './ChangePayrollStructureDialog'
import { ManageAccessDialog } from './ManageAccessDialog'

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground text-right">{value ?? '—'}</span>
    </div>
  )
}

export function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const canUpdate = usePermission('employee:update')
  const canAssignRole = usePermission('role:assign')
  const [changePayrollOpen, setChangePayrollOpen] = useState(false)
  const [manageAccessOpen, setManageAccessOpen] = useState(false)

  const employeeQueryKey = ['employee', id]

  const { data: emp, isLoading } = useQuery({
    queryKey: employeeQueryKey,
    queryFn: () => employeesApi.get(id!),
    enabled: !!id,
  })

  const userId = emp?.user?.id

  const { data: userRoles, isLoading: rolesLoading } = useQuery({
    queryKey: ['user-roles', userId],
    queryFn: () => rolesApi.userRoles(userId!),
    enabled: !!userId,
  })

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!emp) return <div className="text-muted-foreground">Employee not found.</div>

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/employees')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold text-foreground flex-1">Employee Profile</h1>
        {canUpdate && (
          <Button variant="outline" size="sm" onClick={() => setChangePayrollOpen(true)}>
            <Wallet className="h-4 w-4 mr-1.5" />
            Change Payroll Structure
          </Button>
        )}
      </div>

      {/* Header card */}
      <Card className="shadow-sm">
        <CardContent className="pt-6">
          <div className="flex items-start gap-5">
            <Avatar className="h-20 w-20 ring-4 ring-primary/10">
              <AvatarImage src={emp.profilePhotoUrl ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {getInitials(emp.firstName, emp.lastName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{emp.firstName} {emp.lastName}</h2>
                  <p className="text-muted-foreground text-sm">{emp.designation?.name ?? '—'} · {emp.department?.name ?? '—'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">{emp.empCode}</p>
                </div>
                <StatusBadge status={emp.status} type="employee" />
              </div>
              <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{emp.email}</span>
                {emp.phone && <span className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{emp.phone}</span>}
                {emp.workLocation && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{emp.workLocation}</span>}
                <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />Joined {formatDate(emp.joiningDate)}</span>
                <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" />{EMPLOYMENT_TYPE_LABELS[emp.employmentType]}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="personal">
        <TabsList className="grid grid-cols-4 md:grid-cols-5 w-full md:w-auto">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="employment">Employment</TabsTrigger>
          <TabsTrigger value="bank">Bank</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
          <TabsTrigger value="documents" className="hidden md:block">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Personal Information</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Date of Birth" value={formatDate(emp.dateOfBirth)} />
              <InfoRow label="Gender" value={emp.gender ?? undefined} />
              <InfoRow label="Nationality" value={emp.nationality ?? undefined} />
              <InfoRow label="Blood Group" value={emp.bloodGroup ?? undefined} />
              <InfoRow label="Phone" value={emp.phone} />
              <InfoRow label="Personal Email" value={emp.email} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employment">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Employment Details</CardTitle></CardHeader>
            <CardContent>
              <InfoRow label="Employee Code" value={emp.empCode} />
              <InfoRow label="Department" value={emp.department?.name} />
              <InfoRow label="Designation" value={emp.designation?.name} />
              <InfoRow label="Reporting Manager" value={emp.reportingManager ? `${emp.reportingManager.firstName} ${emp.reportingManager.lastName}` : undefined} />
              <InfoRow label="Employment Type" value={EMPLOYMENT_TYPE_LABELS[emp.employmentType]} />
              <InfoRow label="Joining Date" value={formatDate(emp.joiningDate)} />
              <InfoRow label="Probation End" value={formatDate(emp.probationEndDate)} />
              <InfoRow label="PF Number" value={emp.pfNumber ?? undefined} />
              <InfoRow label="ESI Number" value={emp.esiNumber ?? undefined} />
              <InfoRow label="UAN" value={emp.uanNumber ?? undefined} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bank">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Bank Details</CardTitle></CardHeader>
            <CardContent>
              {emp.bankDetails ? (
                <>
                  <InfoRow label="Account Holder" value={emp.bankDetails.accountHolderName} />
                  <InfoRow label="Account Number" value={emp.bankDetails.accountNumber} />
                  <InfoRow label="IFSC Code" value={emp.bankDetails.ifscCode} />
                  <InfoRow label="Bank Name" value={emp.bankDetails.bankName} />
                  <InfoRow label="Branch" value={emp.bankDetails.branchName} />
                  <InfoRow label="Account Type" value={emp.bankDetails.accountType} />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No bank details added.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emergency">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Emergency Contact</CardTitle></CardHeader>
            <CardContent>
              {emp.emergencyContact ? (
                <>
                  <InfoRow label="Name" value={emp.emergencyContact.name} />
                  <InfoRow label="Phone" value={emp.emergencyContact.phone} />
                  <InfoRow label="Relationship" value={emp.emergencyContact.relationship} />
                  <InfoRow label="Address" value={emp.emergencyContact.address} />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No emergency contact added.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Documents</CardTitle></CardHeader>
            <CardContent>
              {emp.documents && emp.documents.length > 0 ? (
                <div className="space-y-2">
                  {emp.documents.map((doc, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{doc.documentType}</p>
                        {doc.notes && <p className="text-xs text-muted-foreground">{doc.notes}</p>}
                      </div>
                      <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">
                        View
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No documents uploaded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {emp.reportingManager && (
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Reporting Manager</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={emp.reportingManager.profilePhotoUrl ?? undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {getInitials(emp.reportingManager.firstName, emp.reportingManager.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{emp.reportingManager.firstName} {emp.reportingManager.lastName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {userId && (
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Roles &amp; Access
            </CardTitle>
            {canAssignRole && (
              <Button variant="outline" size="sm" onClick={() => setManageAccessOpen(true)}>
                Manage Access
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {rolesLoading ? (
              <Skeleton className="h-6 w-40" />
            ) : userRoles && userRoles.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {userRoles.map((r) => (
                  <Badge key={r.id} variant="secondary">{r.name}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No roles assigned.</p>
            )}
          </CardContent>
        </Card>
      )}

      {canUpdate && (
        <ChangePayrollStructureDialog
          open={changePayrollOpen}
          onOpenChange={setChangePayrollOpen}
          employee={emp}
        />
      )}

      {canAssignRole && userId && (
        <ManageAccessDialog
          open={manageAccessOpen}
          onOpenChange={setManageAccessOpen}
          userId={userId}
          employeeQueryKey={['user-roles', userId]}
          currentRoleIds={(userRoles ?? []).map((r) => r.id)}
        />
      )}
    </div>
  )
}
