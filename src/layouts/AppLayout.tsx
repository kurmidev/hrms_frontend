import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { ForceChangePasswordDialog } from '@/features/auth/ForceChangePasswordDialog'
import { useUiStore } from '@/store/ui.store'
import { cn } from '@/lib/utils'

export function AppLayout() {
  const { sidebarOpen } = useUiStore()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <div
        className={cn(
          'flex flex-col flex-1 min-w-0 transition-all duration-300',
          sidebarOpen ? 'md:ml-[260px]' : 'md:ml-[64px]'
        )}
      >
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
      <ForceChangePasswordDialog />
    </div>
  )
}
