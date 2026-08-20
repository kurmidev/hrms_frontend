import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Resolver } from 'react-hook-form'
import { MapPin, Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { workLocationsApi } from '@/api/work-locations.api'
import type { WorkLocation } from '@/types/work-location.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { toast } from 'sonner'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  lat: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number({ message: 'Latitude is required' })),
  lng: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number({ message: 'Longitude is required' })),
  radiusMeters: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number({ message: 'Radius is required' }).min(1, 'Radius must be at least 1m'),
  ),
  isActive: z.boolean().optional(),
})
type FormValues = z.infer<typeof schema>

export function WorkLocationsPage() {
  const qc = useQueryClient()
  const { page, limit, setPage } = usePagination()
  const canManage = usePermission('org:update')

  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<WorkLocation | null>(null)
  const [deleteItem, setDeleteItem] = useState<WorkLocation | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['work-locations', { page, limit }],
    queryFn: () => workLocationsApi.list({ page, limit }),
  })

  const items = (data as { data?: WorkLocation[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })

  const openCreate = () => {
    reset({ name: '', lat: undefined, lng: undefined, radiusMeters: 200, isActive: true })
    setEditItem(null)
    setOpen(true)
  }

  const openEdit = (item: WorkLocation) => {
    reset({ name: item.name, lat: item.lat, lng: item.lng, radiusMeters: item.radiusMeters, isActive: item.isActive })
    setEditItem(item)
    setOpen(true)
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      editItem
        ? workLocationsApi.update(editItem.id, values)
        : workLocationsApi.create({
            name: values.name,
            lat: values.lat,
            lng: values.lng,
            radiusMeters: values.radiusMeters,
            isActive: values.isActive,
          }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-locations'] })
      setOpen(false)
      toast.success(editItem ? 'Work location updated.' : 'Work location created.')
    },
    onError: () => toast.error('Failed to save work location.'),
  })

  const { mutate: del, isPending: deleting } = useMutation({
    mutationFn: (id: string) => workLocationsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['work-locations'] })
      setDeleteItem(null)
      toast.success('Work location deleted.')
    },
    onError: () => toast.error('Failed to delete work location.'),
  })

  const columns: Column<WorkLocation>[] = [
    { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-foreground">{row.name}</span> },
    { key: 'lat', header: 'Latitude', render: (row) => row.lat.toFixed(6) },
    { key: 'lng', header: 'Longitude', render: (row) => row.lng.toFixed(6) },
    { key: 'radiusMeters', header: 'Radius (m)', render: (row) => row.radiusMeters },
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
          render: (row: WorkLocation) => (
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
        } as Column<WorkLocation>]
      : []),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <MapPin className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Work Locations</h1>
            <p className="text-sm text-muted-foreground">Geo-fenced sites for attendance & OD location naming</p>
          </div>
        </div>
        {canManage && (
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Location
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
        emptyMessage="No work locations defined yet."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[92vw] sm:w-[85vw] max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Work Location' : 'New Work Location'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => save(v))} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="wl-name">Name *</Label>
              <Input id="wl-name" placeholder="e.g. HQ - Andheri" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="wl-lat">Latitude *</Label>
                <Input id="wl-lat" type="number" step="any" placeholder="19.076" {...register('lat')} />
                {errors.lat && <p className="text-xs text-destructive">{errors.lat.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="wl-lng">Longitude *</Label>
                <Input id="wl-lng" type="number" step="any" placeholder="72.8777" {...register('lng')} />
                {errors.lng && <p className="text-xs text-destructive">{errors.lng.message}</p>}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wl-radius">Recognition Radius (meters) *</Label>
              <Input id="wl-radius" type="number" placeholder="200" {...register('radiusMeters')} />
              {errors.radiusMeters && <p className="text-xs text-destructive">{errors.radiusMeters.message}</p>}
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
        title="Delete Work Location"
        description={`Delete "${deleteItem?.name}"? Attendance records already resolved to this location keep their stored name.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={() => deleteItem && del(deleteItem.id)}
        variant="destructive"
      />
    </div>
  )
}
