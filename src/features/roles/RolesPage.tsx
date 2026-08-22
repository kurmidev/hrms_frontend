import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Shield, Loader2, Search, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { rolesApi } from '@/api/roles.api'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PERMISSION_GROUPS } from '@/lib/constants'
import { titleCaseRoleName, getRoleTheme } from '@/lib/roles'
import { RoleCard } from '@/features/roles/RoleCard'
import type { Role } from '@/types/organization.types'
import { usePermission } from '@/hooks/usePermission'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'Select at least one permission'),
})
type FormValues = z.infer<typeof schema>

const INITIAL_OPEN_GROUP_COUNT = 3

export function RolesPage() {
  const qc = useQueryClient()
  const canView = usePermission('role:read')
  const canCreate = usePermission('role:create')
  const canEdit = usePermission('role:update')
  const canDelete = usePermission('role:delete')
  const [open, setOpen] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [deleteRole, setDeleteRole] = useState<Role | null>(null)
  const [search, setSearch] = useState('')
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.list,
    enabled: canView,
  })

  const filteredRoles = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return roles
    return roles.filter((role) => {
      const displayName = titleCaseRoleName(role.name).toLowerCase()
      return (
        displayName.includes(q) ||
        role.name.toLowerCase().includes(q) ||
        (role.description ?? '').toLowerCase().includes(q)
      )
    })
  }, [roles, search])

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { permissions: [] },
  })

  const selectedPerms = watch('permissions')

  const groupNames = Object.keys(PERMISSION_GROUPS)

  const openCreate = () => {
    reset({ permissions: [] })
    setEditRole(null)
    setCollapsedGroups(new Set(groupNames.slice(INITIAL_OPEN_GROUP_COUNT)))
    setOpen(true)
  }
  const openEdit = (role: Role) => {
    reset({ name: role.name, description: role.description ?? '', permissions: role.permissions })
    setEditRole(role)
    setCollapsedGroups(new Set(groupNames.slice(INITIAL_OPEN_GROUP_COUNT)))
    setOpen(true)
  }
  const openDuplicate = (role: Role) => {
    reset({
      name: `${titleCaseRoleName(role.name)} Copy`,
      description: role.description ?? '',
      permissions: role.permissions,
    })
    setEditRole(null)
    setCollapsedGroups(new Set(groupNames.slice(INITIAL_OPEN_GROUP_COUNT)))
    setOpen(true)
  }

  const toggleGroupCollapsed = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(group)) next.delete(group)
      else next.add(group)
      return next
    })
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: FormValues) =>
      editRole ? rolesApi.update(editRole.id, data) : rolesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      setOpen(false)
      toast.success(editRole ? 'Role updated.' : 'Role created.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to save role.')),
  })

  const { mutate: del, isPending: deleting } = useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      setDeleteRole(null)
      toast.success('Role deleted.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Cannot delete role — it may still be assigned to users.')),
  })

  const togglePermission = (perm: string) => {
    const cur = selectedPerms ?? []
    setValue('permissions', cur.includes(perm) ? cur.filter((p) => p !== perm) : [...cur, perm], { shouldValidate: true })
  }

  if (!canView) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Roles & Permissions</h1>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          You do not have permission to view roles.
        </div>
      </div>
    )
  }

  const editTheme = editRole ? getRoleTheme(editRole) : null
  const EditIcon = editTheme?.icon ?? Shield

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Roles & Permissions</h1>
            <p className="text-sm text-muted-foreground">Manage access control roles</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search roles..."
              className="pl-8 h-9 w-56"
            />
          </div>
          {canCreate && (
            <Button onClick={openCreate} size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              New Role
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : filteredRoles.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          {search ? 'No roles match your search.' : 'No roles found.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoles.map((role) => (
            <RoleCard
              key={role.id}
              role={role}
              canEdit={canEdit}
              canDelete={canDelete}
              canDuplicate={canCreate}
              onEdit={openEdit}
              onDelete={setDeleteRole}
              onDuplicate={openDuplicate}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[92vw] sm:w-[85vw] lg:w-[70vw] max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2.5">
              {editTheme && (
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${editTheme.badgeClasses}`}>
                  <EditIcon className="h-4 w-4" />
                </div>
              )}
              <DialogTitle>{editRole ? `Edit ${titleCaseRoleName(editRole.name)}` : 'Create Role'}</DialogTitle>
            </div>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => save(v))} className="space-y-5 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Role Name *</Label>
                <Input id="name" placeholder="e.g. HR Manager" {...register('name')} />
                {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Input id="description" placeholder="Short description..." {...register('description')} />
              </div>
            </div>

            <div className="space-y-3">
              <Label>Permissions *</Label>
              {errors.permissions && <p className="text-xs text-destructive">{errors.permissions.message}</p>}
              <div className="space-y-2">
                {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => {
                  const isCollapsed = collapsedGroups.has(group)
                  const selectedInGroup = perms.filter((p) => selectedPerms?.includes(p)).length
                  return (
                    <div key={group} className="rounded-md border border-border/60">
                      <button
                        type="button"
                        onClick={() => toggleGroupCollapsed(group)}
                        className="w-full flex items-center justify-between px-3 py-2 text-left"
                      >
                        <span className="text-xs font-semibold text-foreground uppercase tracking-wide">
                          {group}
                          {selectedInGroup > 0 && (
                            <span className="ml-1.5 text-primary normal-case font-medium">
                              ({selectedInGroup}/{perms.length})
                            </span>
                          )}
                        </span>
                        {isCollapsed ? (
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : (
                          <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </button>
                      {!isCollapsed && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-3 gap-y-2 px-3 pb-3">
                          {perms.map((perm) => (
                            <label key={perm} className="flex items-start gap-2 cursor-pointer min-w-0">
                              <Checkbox
                                className="mt-0.5"
                                checked={selectedPerms?.includes(perm) ?? false}
                                onCheckedChange={() => togglePermission(perm)}
                              />
                              <span className="text-sm text-foreground break-all">{perm}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editRole ? 'Update Role' : 'Create Role'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteRole}
        onOpenChange={(o) => !o && setDeleteRole(null)}
        title="Delete Role"
        description={`Are you sure you want to delete "${deleteRole ? titleCaseRoleName(deleteRole.name) : ''}"? This cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={() => deleteRole && del(deleteRole.id)}
        variant="destructive"
      />
    </div>
  )
}
