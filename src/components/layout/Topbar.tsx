import { Bell, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuthStore } from '@/store/auth.store'
import { useUiStore } from '@/store/ui.store'
import { authApi } from '@/api/auth.api'
import { getInitials, getFullName } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

export function Topbar() {
  const { user, logout } = useAuthStore()
  const { toggleSidebar } = useUiStore()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    logout()
    navigate('/login')
  }

  const name = user?.employee
    ? getFullName(user.employee.firstName, user.employee.lastName)
    : user?.email ?? 'User'

  return (
    <header className="h-14 bg-white border-b border-border flex items-center px-4 gap-3 flex-shrink-0 shadow-sm z-10">
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleSidebar}>
        <Menu className="h-4 w-4" />
      </Button>

      <div className="flex-1" />

      <Button variant="ghost" size="icon" className="h-8 w-8 relative">
        <Bell className="h-4 w-4" />
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-accent transition-colors outline-none">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.employee?.profilePhotoUrl ?? undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
              {getInitials(name.split(' ')[0] ?? '', name.split(' ')[1])}
            </AvatarFallback>
          </Avatar>
          <div className="hidden md:block text-left">
            <p className="text-sm font-medium leading-none text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{user?.roles?.[0]?.name ?? 'User'}</p>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => navigate('/profile')}>
            Profile
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/change-password')}>
            Change Password
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate('/settings/sessions')}>
            Active Sessions
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
