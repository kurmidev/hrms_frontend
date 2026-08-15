import { Outlet, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

export function AuthLayout() {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated && !user?.mustChangePassword) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary rounded-2xl mb-4 shadow-lg">
            <span className="text-primary-foreground text-2xl font-bold">H</span>
          </div>
          <h1 className="text-2xl font-bold text-white">HRMS Portal</h1>
          <p className="text-slate-400 text-sm mt-1">Human Resource Management System</p>
        </div>
        <div className="bg-card rounded-2xl shadow-2xl border border-border/50 p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
