import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Resolver } from 'react-hook-form'
import { MapPinned, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { zonesApi } from '@/api/zones.api'
import type { Zone } from '@/types/zone.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  isActive: z.boolean().optional(),
})
type FormValues = z.infer<typeof schema>

export function ZonesPage() {
  const qc = useQueryClient()
  const { page, limit, setPage } = usePagination()
  const canManage = usePermission('org:update')

  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<Zone | null>(null)
  const [deleteItem, setDeleteItem] = useState<Zone | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['zones', { page, limit }],
    queryFn: () => zonesApi.list({ page, limit }),
  })

  const items = (data as { data?: Zone[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })

  const openCreate = () => {
    reset({ name: '', isActive: true })
    setEditItem(null)
    setOpen(true)
  }

  const openEdit = (item: Zone) => {
    reset({ name: item.name, isActive: item.isActive })
    setEditItem(item)
    setOpen(true)
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      editItem
        ? zonesApi.update(editItem.id, values)
        : zonesApi.create({ name: values.name, isActive: values.isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones'] })
      setOpen(false)
      toast.success(editItem ? 'Zone updated.' : 'Zone created.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to save zone.')),
  })

  const { mutate: del, isPending: deleting } = useMutation({
    mutationFn: (id: string) => zonesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones'] })
      setDeleteItem(null)
      toast.success('Zone deleted.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to delete zone.')),
  })

  const columns: Column<Zone>[] = [
    { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-foreground">{row.name}</span> },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <StatusBadge
          status={row.isActive ? 'Active' : 'Inactive'}
          type="generic"
          colorClass={row.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}
        />
      ),
    },
    ...(canManage
      ? [{
          key: 'actions',
          header: '',
          render: (row: Zone) => (
            <div className="flex gap-1 justify-end">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => setDeleteItem(row)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ),
        } as Column<Zone>]
      : []),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center">
            <MapPinned className="h-5 w-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Zones</h1>
            <p className="text-sm text-muted-foreground">Group employees by region for zone-specific global leave days</p>
          </div>
        </div>
        {canManage && (
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Zone
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        rowKey={(r) => r.id}
        emptyMessage="No zones defined yet."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[92vw] sm:w-[85vw] max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Zone' : 'New Zone'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => save(v))} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="zone-name">Name *</Label>
              <Input id="zone-name" placeholder="e.g. North Zone" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" {...register('isActive')} />
              Active
            </label>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editItem ? 'Save Changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(o) => !o && setDeleteItem(null)}
        title="Delete Zone"
        description={`Delete "${deleteItem?.name}"? This cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={() => deleteItem && del(deleteItem.id)}
        variant="destructive"
      />
    </div>
  )
}
