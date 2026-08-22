import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Loader2, Award } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { incentiveRulesApi } from '@/api/incentives.api'
import type { IncentiveRule } from '@/types/incentives.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Required'),
  type: z.string().min(1, 'Required'),
  rate: z.preprocess((v) => (v === '' ? undefined : Number(v)), z.number().min(0, 'Rate must be 0 or more')),
  isActive: z.boolean(),
})
type FormValues = z.infer<typeof schema>

export function IncentiveRulesPage() {
  const qc = useQueryClient()
  const { page, limit, setPage } = usePagination()
  const canManage = usePermission('incentive:manage')
  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<IncentiveRule | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['incentive-rules', { page, limit }],
    queryFn: () => incentiveRulesApi.list({ page, limit }),
    enabled: canManage,
  })

  const rules = (data as { data?: IncentiveRule[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { isActive: true },
  })
  const isActive = watch('isActive')

  const openCreate = () => {
    reset({ name: '', type: '', rate: 0, isActive: true })
    setEditItem(null)
    setOpen(true)
  }

  const openEdit = (item: IncentiveRule) => {
    reset({ name: item.name, type: item.type, rate: item.rate, isActive: item.isActive })
    setEditItem(item)
    setOpen(true)
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      editItem ? incentiveRulesApi.update(editItem.id, values) : incentiveRulesApi.create(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['incentive-rules'] })
      setOpen(false)
      toast.success(editItem ? 'Incentive rule updated.' : 'Incentive rule created.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to save incentive rule.')),
  })

  const columns: Column<IncentiveRule>[] = [
    { key: 'name', header: 'Name' },
    { key: 'type', header: 'Type' },
    { key: 'rate', header: 'Rate' },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <StatusBadge
          status={row.isActive ? 'ACTIVE' : 'INACTIVE'}
          type="generic"
          label={row.isActive ? 'Active' : 'Inactive'}
          colorClass={row.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}
        />
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-20 text-right',
      render: (row) => (
        <div className="flex justify-end">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); openEdit(row) }}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
    },
  ]

  if (!canManage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Award className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Incentive Rules</h1>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          You do not have permission to view incentive rules.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Award className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Incentive Rules</h1>
            <p className="text-sm text-muted-foreground">{meta?.total ?? 0} rules</p>
          </div>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          New Rule
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={rules}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        onRowClick={openEdit}
        rowKey={(r) => r.id}
        emptyMessage="No incentive rules found."
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[92vw] sm:w-[85vw] max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Incentive Rule' : 'New Incentive Rule'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => save(v))} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="e.g. Field Survey Incentive" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Type *</Label>
              <Input id="type" placeholder="e.g. PER_UNIT" {...register('type')} />
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rate">Rate *</Label>
              <Input id="rate" type="number" step="0.01" min="0" {...register('rate')} />
              {errors.rate && <p className="text-xs text-destructive">{errors.rate.message}</p>}
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="isActive"
                checked={isActive}
                onCheckedChange={(checked) => setValue('isActive', checked === true)}
              />
              <Label htmlFor="isActive" className="cursor-pointer">Active</Label>
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
    </div>
  )
}
