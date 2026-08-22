import { Navigate, Outlet, Link, useLocation } from 'react-router-dom'
import { usePlatformAuthStore } from '@/store/platform-auth.store'
import { Building2, CreditCard, FileText, LayoutDashboard, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Dashboard', href: '/platform/dashboard', icon: LayoutDashboard },
  { label: 'Organizations', href: '/platform/organizations', icon: Building2 },
  { label: 'Plans', href: '/platform/plans', icon: CreditCard },
  { label: 'Invoices', href: '/platform/invoices', icon: FileText },
]

export function PlatformLayout() {
  const { isAuthenticated, admin, logout } = usePlatformAuthStore()
  const location = useLocation()

  if (!isAuthenticated) return <Navigate to="/platform/login" replace />

  return (
    <div className="platform-shell flex h-screen bg-[var(--platform-bg)] text-white">
      <aside className="w-60 flex-shrink-0 bg-[var(--platform-surface)] border-r border-[var(--platform-border)] flex flex-col">
        <div className="px-5 py-4 border-b border-[var(--platform-border)]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--platform-accent)] rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold">H</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">HRMS Platform</p>
              <p className="text-xs text-[var(--platform-muted)]">Admin Console</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.icon
            const active = location.pathname.startsWith(item.href)
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  active
                    ? 'bg-[var(--platform-accent)] text-white'
                    : 'text-[var(--platform-muted)] hover:text-white hover:bg-[var(--platform-raised)]'
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-[var(--platform-border)]">
          <div className="px-3 py-2">
            <p className="text-xs text-[var(--platform-muted)] truncate">{admin?.email}</p>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--platform-muted)] hover:text-white hover:bg-[var(--platform-raised)] transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
