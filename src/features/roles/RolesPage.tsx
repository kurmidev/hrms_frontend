import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Shield, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { rolesApi } from '@/api/roles.api'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { PERMISSION_GROUPS } from '@/lib/constants'
import type { Role } from '@/types/organization.types'
import { usePermission } from '@/hooks/usePermission'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  permissions: z.array(z.string()).min(1, 'Select at least one permission'),
})
type FormValues = z.infer<typeof schema>

export function RolesPage() {
  const qc = useQueryClient()
  const canView = usePermission('role:read')
  const canCreate = usePermission('role:create')
  const canEdit = usePermission('role:update')
  const canDelete = usePermission('role:delete')
  const [open, setOpen] = useState(false)
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [deleteRole, setDeleteRole] = useState<Role | null>(null)

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.list,
    enabled: canView,
  })

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { permissions: [] },
  })

  const selectedPerms = watch('permissions')

  const openCreate = () => { reset({ permissions: [] }); setEditRole(null); setOpen(true) }
  const openEdit = (role: Role) => {
    reset({ name: role.name, description: role.description ?? '', permissions: role.permissions })
    setEditRole(role)
    setOpen(true)
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: FormValues) =>
      editRole ? rolesApi.update(editRole.id, data) : rolesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      setOpen(false)
      toast.success(editRole ? 'Role updated.' : 'Role created.')
    },
    onError: () => toast.error('Failed to save role.'),
  })

  const { mutate: del, isPending: deleting } = useMutation({
    mutationFn: (id: string) => rolesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles'] })
      setDeleteRole(null)
      toast.success('Role deleted.')
    },
    onError: () => toast.error('Cannot delete role — it may still be assigned to users.'),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
            <Shield className="h-5 w-5 text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Roles & Permissions</h1>
            <p className="text-sm text-muted-foreground">Manage access control roles</p>
          </div>
        </div>
        {canCreate && (
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Role
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <Card key={role.id} className="shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold">{role.name}</CardTitle>
                    {role.description && <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>}
                  </div>
                  {role.isSystemRole ? (
                    <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-0">System</Badge>
                  ) : (canEdit || canDelete) ? (
                    <div className="flex gap-1">
                      {canEdit && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(role)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteRole(role)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-2">{role.permissions.length} permissions</p>
                <div className="flex flex-wrap gap-1">
                  {role.permissions.slice(0, 6).map((p) => (
                    <Badge key={p} variant="outline" className="text-[10px] py-0">{p}</Badge>
                  ))}
                  {role.permissions.length > 6 && (
                    <Badge variant="outline" className="text-[10px] py-0">+{role.permissions.length - 6}</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
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
              <div className="space-y-4">
                {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                  <div key={group}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{group}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {perms.map((perm) => (
                        <label key={perm} className="flex items-center gap-2 cursor-pointer">
                          <Checkbox
                            checked={selectedPerms?.includes(perm) ?? false}
                            onCheckedChange={() => togglePermission(perm)}
                          />
                          <span className="text-sm text-foreground">{perm}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
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
        description={`Are you sure you want to delete "${deleteRole?.name}"? This cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={() => deleteRole && del(deleteRole.id)}
        variant="destructive"
      />
    </div>
  )
}
