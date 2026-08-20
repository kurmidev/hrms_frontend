import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CreditCard, Plus, Pencil, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { payrollStructuresApi } from '@/api/payroll-structures.api'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'
import type { PayrollStructure } from '@/types/organization.types'
import { PayrollStructureDialog } from './PayrollStructureDialog'

export function PayrollStructuresPage() {
  const qc = useQueryClient()
  const { page, limit } = usePagination()
  const canView = usePermission('payroll:read')
  const canCreate = usePermission('payroll:create')
  const canEdit = usePermission('payroll:update')
  const canDelete = usePermission('payroll:delete')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<PayrollStructure | null>(null)
  const [deleteItem, setDeleteItem] = useState<PayrollStructure | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['payroll-structures', { page, limit }],
    queryFn: () => payrollStructuresApi.list({ page, limit }),
    enabled: canView,
  })

  const { mutate: del, isPending: deleting } = useMutation({
    mutationFn: (id: string) => payrollStructuresApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payroll-structures'] })
      setDeleteItem(null)
      toast.success('Payroll structure deleted.')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to delete payroll structure.')),
  })

  const openCreate = () => { setEditItem(null); setDialogOpen(true) }
  const openEdit = (item: PayrollStructure) => { setEditItem(item); setDialogOpen(true) }

  const structures: PayrollStructure[] = (data as { data?: PayrollStructure[] })?.data ?? []

  if (!canView) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Payroll Structures</h1>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          You do not have permission to view payroll structures.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <CreditCard className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Payroll Structures</h1>
            <p className="text-sm text-muted-foreground">Salary component configurations</p>
          </div>
        </div>
        {canCreate && (
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Payroll Structure
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {structures.map((s) => (
            <Card key={s.id} className="shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-semibold">{s.name}</CardTitle>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className={`text-[10px] border-0 ${s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {s.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    {canEdit && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(s)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteItem(s)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Components</p>
                  {s.components.map((c, i) => (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-foreground">{c.name}</span>
                      <span className={`font-medium ${c.isDeductible ? 'text-red-500' : 'text-emerald-600'}`}>
                        {c.isDeductible ? '-' : '+'}
                        {c.type === 'PERCENTAGE' ? `${c.value}%` : `₹${c.value}`}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PayrollStructureDialog open={dialogOpen} onOpenChange={setDialogOpen} editItem={editItem} />

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(o) => !o && setDeleteItem(null)}
        title="Delete Payroll Structure"
        description={`Delete "${deleteItem?.name}"? This is blocked if employees are currently assigned.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={() => deleteItem && del(deleteItem.id)}
        variant="destructive"
      />
    </div>
  )
}
