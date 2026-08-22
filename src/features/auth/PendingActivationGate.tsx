import { useNavigate } from 'react-router-dom'
import { Hourglass } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'

// A user whose onboarding approval already created their login, but whose
// Employee.status is still PRE_BOARDING (HR has not yet activated them), must
// not be able to take any action anywhere in the portal — mirrors the
// mustChangePassword gate pattern (ForceChangePasswordDialog.tsx), but there
// is no self-service action the employee themselves can take here, so this
// is a full-screen block with only a logout option, not a form dialog.
export function PendingActivationGate() {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()

  if (user?.employee?.status !== 'PRE_BOARDING') return null

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    logout()
    navigate('/login')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-orange/10">
          <Hourglass className="h-7 w-7 text-accent-orange" />
        </div>
        <h1 className="text-lg font-semibold text-foreground">Account pending activation</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your onboarding has been approved, but HR has not yet activated your account.
          You'll be able to use the portal once activation is complete — please contact HR.
        </p>
        <Button variant="outline" className="mt-6 w-full" onClick={handleLogout}>
          Log out
        </Button>
      </div>
    </div>
  )
}
