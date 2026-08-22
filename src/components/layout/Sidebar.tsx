import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, Building2, Shield, GitBranch,
  Briefcase, CalendarDays, CreditCard, Receipt, UserCheck,
  ChevronDown, ChevronRight, X, Ticket, BarChart3, Settings,
  ClipboardCheck, HeartHandshake, Megaphone, MessageSquareText, Target,
  AlertOctagon, DoorOpen, HeartPulse, Power,
} from 'lucide-react'
import { cn, getInitials, getFullName } from '@/lib/utils'
import { useUiStore } from '@/store/ui.store'
import { useAuthStore } from '@/store/auth.store'
import { authApi } from '@/api/auth.api'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useState } from 'react'

export interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  permission?: string
  children?: { label: string; href: string; permission?: string }[]
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    // No permission — every authenticated user sees their dashboard
  },
  {
    label: 'Organization',
    href: '/organization',
    icon: Building2,
    permission: 'org:read',
    children: [
      { label: 'Profile', href: '/organization', permission: 'org:read' },
      { label: 'Departments', href: '/organization/departments', permission: 'employee:read' },
      { label: 'Designations', href: '/organization/designations', permission: 'employee:read' },
      { label: 'Leave Policies', href: '/organization/leave-policies', permission: 'org:read' },
      { label: 'Work Locations', href: '/organization/work-locations', permission: 'org:read' },
      { label: 'Zones', href: '/organization/zones', permission: 'org:read' },
      { label: 'Payroll Structures', href: '/organization/payroll-structures', permission: 'payroll:read' },
      { label: 'Tax Rules', href: '/organization/tax-rules', permission: 'payroll:read' },
    ],
  },
  {
    label: 'Roles',
    href: '/roles',
    icon: Shield,
    permission: 'role:read',
  },
  {
    label: 'Employees',
    href: '/employees',
    icon: Users,
    permission: 'employee:read',
  },
  {
    label: 'Onboarding',
    href: '/onboarding',
    icon: UserCheck,
    permission: 'onboarding:manage',
  },
  {
    label: 'Leave',
    href: '/leave',
    icon: CalendarDays,
    permission: 'leave:read',
    children: [
      { label: 'My Leave', href: '/leave', permission: 'leave:apply' },
      { label: 'Approvals', href: '/leave/approvals', permission: 'leave:approve' },
      { label: 'Holidays', href: '/leave/holidays', permission: 'leave:read' },
      { label: 'Global Leave', href: '/leave/global-leaves', permission: 'leave:read' },
    ],
  },
  {
    label: 'Attendance',
    href: '/attendance',
    icon: GitBranch,
    permission: 'attendance:read',
    children: [
      { label: 'My Attendance', href: '/attendance/my', permission: 'attendance:checkin' },
      { label: 'On Duty', href: '/attendance/on-duty', permission: 'attendance:checkin' },
      { label: 'All Records', href: '/attendance', permission: 'attendance:read' },
      { label: 'Live Tracking', href: '/attendance/live', permission: 'attendance:read' },
    ],
  },
  {
    label: 'Payroll',
    href: '/payroll',
    icon: CreditCard,
    permission: 'payroll:read',
  },
  {
    label: 'Loans',
    href: '/loans',
    icon: Receipt,
    permission: 'loan:read',
  },
  {
    label: 'Incentives',
    href: '/incentives',
    icon: ClipboardCheck,
    permission: 'todo:create',
    children: [
      { label: 'Todos', href: '/incentives/todos', permission: 'todo:create' },
      { label: 'Incentive Rules', href: '/incentives/rules', permission: 'todo:approve' },
      { label: 'Incentive Ledger', href: '/incentives/ledger', permission: 'payroll:read' },
    ],
  },
  {
    label: 'Green Thanks',
    href: '/green-thanks',
    icon: HeartHandshake,
    permission: 'profile:read',
    children: [
      { label: 'Green Thanks', href: '/green-thanks', permission: 'profile:read' },
      { label: 'Config', href: '/green-thanks/config', permission: 'green_thanks:manage' },
    ],
  },
  {
    label: 'Performance',
    href: '/performance',
    icon: Target,
    permission: 'employee:read',
    children: [
      { label: 'Cycles', href: '/performance', permission: 'employee:read' },
      { label: 'My Ratings', href: '/performance/my-ratings', permission: 'employee:read' },
      { label: 'KPIs', href: '/performance/kpis', permission: 'employee:read' },
    ],
  },
  {
    label: 'Notices',
    href: '/notices',
    icon: Megaphone,
    permission: 'employee:read',
    children: [
      { label: 'Notice Board', href: '/notices', permission: 'employee:read' },
      { label: 'Manage Notices', href: '/notices/manage', permission: 'onboarding:manage' },
    ],
  },
  {
    label: 'Chat',
    href: '/chat',
    icon: MessageSquareText,
    // No permission — chat is available to every authenticated employee
  },
  {
    label: 'Assets',
    href: '/assets',
    icon: Briefcase,
    permission: 'asset:read',
    children: [
      { label: 'All Assets', href: '/assets', permission: 'asset:read' },
      { label: 'My Assets', href: '/assets/my', permission: 'asset:read' },
    ],
  },
  {
    label: 'Disciplinary',
    href: '/disciplinary',
    icon: AlertOctagon,
    permission: 'exit:manage',
  },
  {
    label: 'Exit Management',
    href: '/exit',
    icon: DoorOpen,
    permission: 'exit:manage',
  },
  {
    label: 'Insurance',
    href: '/insurance',
    icon: HeartPulse,
    permission: 'employee:read',
  },
  {
    label: 'Service Requests',
    href: '/service-requests',
    icon: Ticket,
    permission: 'service_request:read',
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
    permission: 'report:read',
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    children: [
      { label: 'Active Sessions', href: '/settings/sessions' },
    ],
  },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { sidebarOpen, setSidebarOpen } = useUiStore()
  const { hasPermission, user, logout } = useAuthStore()
  const organizationLogoUrl = user?.organizationLogoUrl
  const organizationName = user?.organizationName
  const [expanded, setExpanded] = useState<string[]>(['/organization'])

  const userName = user?.employee
    ? getFullName(user.employee.firstName, user.employee.lastName)
    : user?.email ?? 'User'
  const userRole = user?.roles?.[0]?.name ?? 'User'

  const handleLogout = async () => {
    try { await authApi.logout() } catch { /* ignore */ }
    logout()
    navigate('/login')
  }

  const toggleExpanded = (href: string) => {
    setExpanded((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    )
  }

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/'
    return location.pathname.startsWith(href)
  }

  // A parent nav item must be visible if the user passes ITS OWN permission
  // OR at least one of its children's permissions — otherwise a user whose
  // only granted permission lives on a child (e.g. the seeded `employee`
  // role has `attendance:checkin` but not the parent Attendance item's
  // `attendance:read`) can never discover that child via the sidebar at
  // all, even though the page itself is fully reachable and functional via
  // direct URL. Confirmed live: shi1878@igreentec.in (employee role) could
  // load `/attendance/my` directly with real data, but "Attendance" never
  // appeared in the sidebar because only the parent's `attendance:read` was
  // checked. See known-issues.md.
  const canSeeNavItem = (item: NavItem): boolean => {
    if (!item.permission || hasPermission(item.permission)) return true
    return !!item.children?.some((c) => !c.permission || hasPermission(c.permission))
  }

  const filteredItems = NAV_ITEMS.filter(canSeeNavItem)

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out',
          sidebarOpen ? 'w-[260px]' : 'w-0 md:w-16 overflow-hidden'
        )}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-3 py-4 border-b border-sidebar-border flex-shrink-0">
          {sidebarOpen ? (
            organizationLogoUrl ? (
              <div className="flex-1 min-w-0 bg-white rounded-lg px-3 py-2">
                <img
                  src={organizationLogoUrl}
                  alt={organizationName ?? 'Organization'}
                  className="h-8 w-auto object-contain"
                />
              </div>
            ) : (
              <div className="flex-1 min-w-0 bg-white rounded-lg px-3 py-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-primary rounded-md flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <span className="text-sm font-semibold text-foreground truncate">
                  {organizationName ?? 'Organization'}
                </span>
              </div>
            )
          ) : (
            <div className="w-9 h-9 mx-auto bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <Building2 className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
          {sidebarOpen && (
            <button
              className="ml-auto md:hidden text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* User mini-profile */}
        {sidebarOpen && (
          <div className="flex items-center gap-2.5 px-3 py-3 border-b border-sidebar-border flex-shrink-0">
            <Avatar className="h-9 w-9 flex-shrink-0">
              <AvatarImage src={user?.employee?.profilePhotoUrl ?? undefined} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {getInitials(userName.split(' ')[0] ?? '', userName.split(' ')[1])}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{userName}</p>
              <p className="text-xs text-sidebar-foreground/50 truncate">{userRole}</p>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                onClick={() => navigate('/settings/sessions')}
                title="Settings"
                className="h-7 w-7 flex items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={handleLogout}
                title="Log out"
                className="h-7 w-7 flex items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-accent-red transition-colors"
              >
                <Power className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-3 scrollbar-thin">
          <ul className="space-y-0.5 px-2">
            {filteredItems.map((item) => {
              const Icon = item.icon
              const hasChildren = !!item.children?.length
              const isExpanded = expanded.includes(item.href)
              const active = isActive(item.href)

              return (
                <li key={item.href}>
                  {hasChildren ? (
                    <>
                      <button
                        onClick={() => toggleExpanded(item.href)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                        )}
                      >
                        <Icon className="h-4 w-4 flex-shrink-0" />
                        {sidebarOpen && (
                          <>
                            <span className="flex-1 text-left truncate">{item.label}</span>
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 text-sidebar-foreground/50" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-sidebar-foreground/50" />
                            )}
                          </>
                        )}
                      </button>
                      {sidebarOpen && isExpanded && (
                        <ul className="mt-0.5 ml-4 space-y-0.5 border-l border-sidebar-border pl-3">
                          {item.children
                            ?.filter((c) => !c.permission || hasPermission(c.permission))
                            .map((child) => (
                              <li key={child.href}>
                                <Link
                                  to={child.href}
                                  className={cn(
                                    'block px-3 py-1.5 rounded-md text-xs transition-colors',
                                    location.pathname === child.href
                                      ? 'text-primary font-medium'
                                      : 'text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                                  )}
                                >
                                  {child.label}
                                </Link>
                              </li>
                            ))}
                        </ul>
                      )}
                    </>
                  ) : (
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                        active
                          ? 'bg-primary text-primary-foreground'
                          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {sidebarOpen && <span className="truncate">{item.label}</span>}
                    </Link>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}
