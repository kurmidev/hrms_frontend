import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Loader2, Briefcase } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { designationsApi } from '@/api/designations.api'
import { departmentsApi } from '@/api/departments.api'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import type { Designation } from '@/types/organization.types'
import { toast } from 'sonner'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  departmentId: z.string().min(1, 'Department is required'),
  level: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : Number(v)),
    z.number().int().min(0).optional()
  ),
})
type FormValues = z.infer<typeof schema>

export function DesignationsPage() {
  const qc = useQueryClient()
  const canView = usePermission('employee:read')
  const canCreate = usePermission('employee:create')
  const canEdit = usePermission('employee:update')
  const canDelete = usePermission('employee:delete')
  const { page, limit, setPage } = usePagination()
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<Designation | null>(null)
  const [deleteItem, setDeleteItem] = useState<Designation | null>(null)
  const [deptFilter, setDeptFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['designations', { page, limit, departmentId: deptFilter || undefined }],
    queryFn: () => designationsApi.list({ page, limit, departmentId: deptFilter || undefined }),
    enabled: canView,
  })

  const { data: deptTree = [] } = useQuery({
    queryKey: ['departments-tree'],
    queryFn: departmentsApi.tree,
    enabled: canView,
  })

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })

  const selectedDept = watch('departmentId')

  const openCreate = () => { reset({ name: '', departmentId: '', level: 0 }); setEditItem(null); setOpen(true) }
  const openEdit = (item: Designation) => {
    reset({ name: item.name, departmentId: item.departmentId, level: item.level })
    setEditItem(item); setOpen(true)
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: (data: FormValues) =>
      editItem ? designationsApi.update(editItem.id, data) : designationsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['designations'] })
      setOpen(false)
      toast.success(editItem ? 'Designation updated.' : 'Designation created.')
    },
    onError: () => toast.error('Failed to save designation.'),
  })

  const { mutate: del, isPending: deleting } = useMutation({
    mutationFn: (id: string) => designationsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['designations'] })
      setDeleteItem(null)
      toast.success('Designation deleted.')
    },
    onError: () => toast.error('Cannot delete — employees may be assigned to it.'),
  })

  const flatDepts = (nodes: typeof deptTree): { id: string; name: string }[] =>
    nodes.flatMap((n) => [{ id: n.id, name: n.name }, ...flatDepts(n.children)])

  const columns: Column<Designation>[] = [
    { key: 'name', header: 'Designation' },
    { key: 'department', header: 'Department', render: (row) => row.department?.name ?? '—' },
    { key: 'level', header: 'Level', render: (row) => `L${row.level}` },
    { key: 'employeeCount', header: 'Employees', render: (row) => row.employeeCount ?? 0 },
    ...(canEdit || canDelete
      ? [{
          key: 'actions', header: '',
          className: 'w-20 text-right',
          render: (row: Designation) => (
            <div className="flex gap-1 justify-end">
              {canEdit && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(row) }}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              )}
              {canDelete && (
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteItem(row) }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ),
        } as Column<Designation>]
      : []),
  ]

  const items: Designation[] = (data as { data?: Designation[] })?.data ?? []
  const meta = (data as { meta?: { total: number; page: number; limit: number; totalPages: number } })?.meta

  if (!canView) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Designations</h1>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          You do not have permission to view designations.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Designations</h1>
            <p className="text-sm text-muted-foreground">Job titles and seniority levels</p>
          </div>
        </div>
        {canCreate && (
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Designation
          </Button>
        )}
      </div>

      <div className="flex gap-3">
        <Select value={deptFilter} onValueChange={(v) => setDeptFilter(v ?? '')}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Departments</SelectItem>
            {flatDepts(deptTree).map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        rowKey={(r) => r.id}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Designation' : 'New Designation'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => save(v))} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input placeholder="e.g. Senior Engineer" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Department *</Label>
              <Select value={selectedDept} onValueChange={(v) => setValue('departmentId', v ?? '', { shouldValidate: true })}>
                <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                <SelectContent>
                  {flatDepts(deptTree).map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.departmentId && <p className="text-xs text-destructive">{errors.departmentId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Level (0 = junior, 1 = senior)</Label>
              <Input type="number" min={0} {...register('level')} />
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editItem ? 'Save' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(o) => !o && setDeleteItem(null)}
        title="Delete Designation"
        description={`Delete "${deleteItem?.name}"? Employees using it must be reassigned first.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={() => deleteItem && del(deleteItem.id)}
        variant="destructive"
      />
    </div>
  )
}
