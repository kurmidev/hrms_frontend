import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { KeyRound, Mail, Phone, IdCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { authApi } from '@/api/auth.api'
import { getInitials } from '@/lib/utils'

export function ProfilePage() {
  const navigate = useNavigate()

  const { data: user, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => authApi.me(),
  })

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-64 rounded-xl md:col-span-1" />
        <Skeleton className="h-64 rounded-xl md:col-span-2" />
      </div>
    )
  }

  if (!user) {
    return <div className="text-sm text-muted-foreground">Unable to load profile.</div>
  }

  const employee = user.employee
  const fullName = employee ? `${employee.firstName} ${employee.lastName}`.trim() : user.email
  const initials = employee ? getInitials(employee.firstName, employee.lastName) : getInitials(user.email)
  const primaryRole = user.roles[0]?.name

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">My Profile</h1>
        <p className="text-sm text-muted-foreground">View your account and employee details</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardContent className="flex flex-col items-center text-center gap-3 pt-6">
            <Avatar size="lg" className="size-20">
              {employee?.profilePhotoUrl && <AvatarImage src={employee.profilePhotoUrl} alt={fullName} />}
              <AvatarFallback className="text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-base font-semibold text-foreground">{fullName}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            {primaryRole && (
              <Badge variant="secondary" className="text-xs">{primaryRole}</Badge>
            )}
            <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => navigate('/change-password')}>
              <KeyRound className="h-4 w-4 mr-1.5" />
              Change Password
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>{employee ? 'Employee Details' : 'Account Details'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {employee ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <IdCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Employee Code</p>
                    <p className="text-sm font-medium text-foreground">{employee.empCode}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium text-foreground">{user.phone || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <IdCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="text-sm font-medium text-foreground">{employee.departmentId || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <IdCard className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Designation</p>
                    <p className="text-sm font-medium text-foreground">{employee.designationId || '—'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium text-foreground">{user.email}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Roles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.roles.length > 0 ? (
                      user.roles.map((r) => (
                        <Badge key={r.id} variant="secondary" className="text-xs">{r.name}</Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
