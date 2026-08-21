import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { rolesApi } from '@/api/roles.api'
import type { Role } from '@/types/organization.types'
import { getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  userId: string
  employeeQueryKey: unknown[]
  currentRoleIds: string[]
}

export function ManageAccessDialog({ open, onOpenChange, userId, employeeQueryKey, currentRoleIds }: Props) {
  const qc = useQueryClient()
  const [selectedIds, setSelectedIds] = useState<string[]>(currentRoleIds)

  useEffect(() => {
    if (open) setSelectedIds(currentRoleIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const { data: rolesData, isLoading } = useQuery({
    queryKey: ['roles', { forAccess: true }],
    queryFn: () => rolesApi.list(),
    enabled: open,
  })
  const roles: Role[] = rolesData ?? []

  const toggleRole = (roleId: string) => {
    setSelectedIds((current) =>
      current.includes(roleId) ? current.filter((r) => r !== roleId) : [...current, roleId],
    )
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: async () => {
      const toAdd = selectedIds.filter((id) => !currentRoleIds.includes(id))
      const toRemove = currentRoleIds.filter((id) => !selectedIds.includes(id))
      await Promise.all([
        ...toAdd.map((roleId) => rolesApi.assign({ userId, roleId })),
        ...toRemove.map((roleId) => rolesApi.unassign(userId, roleId)),
      ])
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: employeeQueryKey })
      onOpenChange(false)
      toast.success('Access updated successfully.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to update access.')),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:w-[85vw] lg:w-[70vw] max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Manage Access
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <p className="text-sm text-muted-foreground py-4">Loading roles…</p>
        ) : (
          <div className="rounded-md border border-border max-h-96 overflow-y-auto p-3 space-y-1.5">
            {roles.map((r) => (
              <label key={r.id} className="flex items-start gap-2 py-1 cursor-pointer min-w-0">
                <Checkbox
                  className="mt-0.5"
                  checked={selectedIds.includes(r.id)}
                  onCheckedChange={() => toggleRole(r.id)}
                />
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-foreground break-all">{r.name}</span>
                  {r.description && (
                    <span className="block text-xs text-muted-foreground break-all">{r.description}</span>
                  )}
                </span>
              </label>
            ))}
            {roles.length === 0 && <p className="text-xs text-muted-foreground py-1">No roles found.</p>}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={isPending} onClick={() => save()}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
