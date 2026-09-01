import { Link, Navigate, useLocation } from 'react-router-dom'
import { SearchX } from 'lucide-react'
import { useAuthStore } from '@/store/auth.store'

export function NotFoundPage() {
  const { isAuthenticated } = useAuthStore()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
          <SearchX className="h-10 w-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-3">Page Not Found</h1>
        <p className="text-slate-600 mb-6">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
        <Link to="/" className="text-primary hover:underline font-medium">
          Go back to dashboard
        </Link>
      </div>
    </div>
  )
}
