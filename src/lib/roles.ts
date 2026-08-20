import { Shield, Users, MapPin, User, KeyRound, type LucideIcon } from 'lucide-react'
import type { Role } from '@/types/organization.types'
import { PERMISSION_GROUPS } from '@/lib/constants'

/** Words that must render as fully-uppercase acronyms in a title-cased role name. */
const KNOWN_ACRONYMS = new Set(['hr', 'it'])

/**
 * Title-cases an underscore-separated role name, e.g. `hr_manager` -> "HR Manager".
 * Known acronyms (HR, IT) are rendered fully uppercase instead of title-cased.
 */
export function titleCaseRoleName(name: string): string {
  return name
    .split('_')
    .filter(Boolean)
    .map((word) => {
      const lower = word.toLowerCase()
      if (KNOWN_ACRONYMS.has(lower)) return lower.toUpperCase()
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
    .join(' ')
}

export interface RoleTheme {
  icon: LucideIcon
  /** Tailwind classes for a small icon badge, e.g. "bg-violet-100 text-violet-600" */
  badgeClasses: string
  /** Tailwind classes for text-only accents, e.g. "text-violet-600" */
  textClasses: string
  /** Tailwind classes for a subtle border accent */
  borderClasses: string
}

const ADMIN_ROLES = new Set(['super_admin', 'org_admin', 'it_admin'])
const MANAGER_ROLES = new Set(['hr_manager', 'finance_manager', 'dept_manager'])
const FIELD_ROLES = new Set(['field_supervisor'])
const EMPLOYEE_ROLES = new Set(['employee'])

/**
 * Derives a display theme (icon + color classes) for a role, based on its name.
 * System roles map to a fixed category; custom roles get a sensible default.
 */
export function getRoleTheme(role: Pick<Role, 'name' | 'isSystemRole'>): RoleTheme {
  const key = role.name.toLowerCase()

  if (ADMIN_ROLES.has(key)) {
    return {
      icon: Shield,
      badgeClasses: 'bg-violet-100 text-violet-600',
      textClasses: 'text-violet-600',
      borderClasses: 'border-violet-200',
    }
  }
  if (MANAGER_ROLES.has(key)) {
    return {
      icon: Users,
      badgeClasses: 'bg-blue-100 text-blue-600',
      textClasses: 'text-blue-600',
      borderClasses: 'border-blue-200',
    }
  }
  if (FIELD_ROLES.has(key)) {
    return {
      icon: MapPin,
      badgeClasses: 'bg-amber-100 text-amber-600',
      textClasses: 'text-amber-600',
      borderClasses: 'border-amber-200',
    }
  }
  if (EMPLOYEE_ROLES.has(key)) {
    return {
      icon: User,
      badgeClasses: 'bg-emerald-100 text-emerald-600',
      textClasses: 'text-emerald-600',
      borderClasses: 'border-emerald-200',
    }
  }

  // Custom (non-system) or unrecognized role — neutral default.
  return {
    icon: KeyRound,
    badgeClasses: 'bg-slate-100 text-slate-600',
    textClasses: 'text-slate-600',
    borderClasses: 'border-slate-200',
  }
}

/** Maps a permission string (e.g. "employee:read") to its PERMISSION_GROUPS category name. */
const PERMISSION_TO_GROUP: Record<string, string> = Object.entries(PERMISSION_GROUPS).reduce<Record<string, string>>(
  (acc, [group, perms]) => {
    perms.forEach((perm) => { acc[perm] = group })
    return acc
  },
  {},
)

export interface GroupedPermissions {
  group: string
  permissions: string[]
}

/**
 * Groups a flat list of permission strings by their PERMISSION_GROUPS category,
 * preserving the category order defined in PERMISSION_GROUPS. Unknown permissions
 * (not present in PERMISSION_GROUPS) are bucketed under "Other".
 */
export function groupPermissionsByCategory(permissions: string[]): GroupedPermissions[] {
  const byGroup = new Map<string, string[]>()

  permissions.forEach((perm) => {
    const group = PERMISSION_TO_GROUP[perm] ?? 'Other'
    const existing = byGroup.get(group) ?? []
    byGroup.set(group, [...existing, perm])
  })

  const orderedGroupNames = [...Object.keys(PERMISSION_GROUPS), 'Other']
  return orderedGroupNames
    .filter((group) => byGroup.has(group))
    .map((group) => ({ group, permissions: byGroup.get(group) ?? [] }))
}
