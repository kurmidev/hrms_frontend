import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, ChevronRight, Home } from 'lucide-react'
import { NAV_ITEMS, type NavItem } from './Sidebar'

interface ResolvedPage {
  title: string
  icon: React.ElementType
}

// Matches the current pathname against NAV_ITEMS (and their children) using
// longest-matching-href logic, so e.g. `/leave/holidays` resolves to the
// "Holidays" child label while still using the parent "Leave" icon. Falls
// back to a title derived from the first path segment for unmatched/detail
// routes (e.g. `/employees/:id`).
function resolvePage(pathname: string, navItems: NavItem[]): ResolvedPage {
  if (pathname === '/') {
    return { title: 'Dashboard', icon: LayoutDashboard }
  }

  let bestMatch: ResolvedPage | undefined
  let bestMatchLength = -1

  for (const item of navItems) {
    if (item.href !== '/' && pathname.startsWith(item.href) && item.href.length > bestMatchLength) {
      bestMatch = { title: item.label, icon: item.icon }
      bestMatchLength = item.href.length
    }
    for (const child of item.children ?? []) {
      if (pathname.startsWith(child.href) && child.href.length > bestMatchLength) {
        bestMatch = { title: child.label, icon: item.icon }
        bestMatchLength = child.href.length
      }
    }
  }

  if (bestMatch) return bestMatch

  const firstSegment = pathname.split('/').filter(Boolean)[0] ?? ''
  const fallbackTitle = firstSegment
    ? firstSegment.charAt(0).toUpperCase() + firstSegment.slice(1).replace(/-/g, ' ')
    : 'Dashboard'
  return { title: fallbackTitle, icon: LayoutDashboard }
}

export function Breadcrumb() {
  const location = useLocation()
  const page = resolvePage(location.pathname, NAV_ITEMS)
  const Icon = page.icon

  return (
    <div className="flex items-center justify-between px-4 md:px-6 py-2.5 bg-background border-b border-border flex-shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <h2 className="text-sm font-semibold text-foreground truncate">{page.title}</h2>
      </div>

      <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground flex-shrink-0">
        <Link to="/" className="flex items-center gap-1 hover:text-foreground transition-colors">
          <Home className="h-3 w-3" />
          Home
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-foreground font-medium">{page.title}</span>
      </nav>
    </div>
  )
}
