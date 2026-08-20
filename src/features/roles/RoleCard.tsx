import { useState } from 'react'
import { Pencil, Trash2, ChevronDown, ChevronUp, Users2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import type { Role } from '@/types/organization.types'
import { titleCaseRoleName, getRoleTheme, groupPermissionsByCategory } from '@/lib/roles'

const VISIBLE_GROUP_COUNT = 3

interface RoleCardProps {
  role: Role
  canEdit: boolean
  canDelete: boolean
  onEdit: (role: Role) => void
  onDelete: (role: Role) => void
}

export function RoleCard({ role, canEdit, canDelete, onEdit, onDelete }: RoleCardProps) {
  const [expanded, setExpanded] = useState(false)
  const theme = getRoleTheme(role)
  const Icon = theme.icon
  const groups = groupPermissionsByCategory(role.permissions)
  const visibleGroups = expanded ? groups : groups.slice(0, VISIBLE_GROUP_COUNT)
  const hiddenGroupCount = groups.length - visibleGroups.length

  return (
    <Card className={`shadow-sm hover:shadow-md transition-shadow border-t-2 ${theme.borderClasses}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <div className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${theme.badgeClasses}`}>
              <Icon className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-sm font-semibold text-foreground truncate">{titleCaseRoleName(role.name)}</h3>
                {role.isSystemRole && (
                  <Badge variant="secondary" className="text-[10px] py-0 bg-slate-100 text-slate-600 border-0 shrink-0">
                    System
                  </Badge>
                )}
              </div>
              {role.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{role.description}</p>
              )}
              {typeof role.userCount === 'number' && (
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <Users2 className="h-3 w-3" />
                  {role.userCount} {role.userCount === 1 ? 'user' : 'users'}
                </p>
              )}
            </div>
          </div>
          {!role.isSystemRole && (canEdit || canDelete) && (
            <div className="flex gap-1 shrink-0">
              {canEdit && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(role)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => onDelete(role)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className={`text-[11px] font-semibold uppercase tracking-wide mb-2 ${theme.textClasses}`}>
          {role.permissions.length} permission{role.permissions.length === 1 ? '' : 's'}
        </p>
        <div className="space-y-2">
          {visibleGroups.map(({ group, permissions }) => (
            <div key={group} className="rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold text-foreground uppercase tracking-wide">{group}</span>
                <span className="text-[10px] text-muted-foreground">{permissions.length}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {permissions.map((p) => (
                  <Badge key={p} variant="outline" className="text-[10px] py-0 font-normal">
                    {p}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
        {groups.length > VISIBLE_GROUP_COUNT && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="mt-2 flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
          >
            {expanded ? (
              <>
                Show less <ChevronUp className="h-3 w-3" />
              </>
            ) : (
              <>
                Show {hiddenGroupCount} more group{hiddenGroupCount === 1 ? '' : 's'} <ChevronDown className="h-3 w-3" />
              </>
            )}
          </button>
        )}
      </CardContent>
    </Card>
  )
}
