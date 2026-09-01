import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { AuthMarketingPanel } from '@/features/auth/AuthMarketingPanel'
import igreenLogo from '@/assets/igreen-logo.png'

export function AuthLayout() {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && !user?.mustChangePassword) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-white">
      <AuthMarketingPanel />

      <div className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex justify-center">
            <img src={igreenLogo} alt="iGreen Technologies" className="h-12 w-auto object-contain" />
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  )
}
