import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import igreenLogo from '@/assets/igreen-logo.png'

export function AuthLayout() {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && !user?.mustChangePassword) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center bg-white rounded-2xl mb-4 px-6 py-4 shadow-lg">
            <img src={igreenLogo} alt="iGreen Technologies" className="h-12 w-auto object-contain" />
          </div>
          <p className="text-neutral-400 text-sm mt-1">HR Management Portal</p>
        </div>
        <div className="bg-card rounded-2xl shadow-2xl border border-border/50 p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
