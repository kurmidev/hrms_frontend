import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Receipt, Plus, Pencil, Trash2 } from 'lucide-react'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { taxRulesApi } from '@/api/tax-rules.api'
import { formatDate, getApiErrorMessage } from '@/lib/utils'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { toast } from 'sonner'
import type { TaxRule } from '@/types/organization.types'
import { TaxRuleDialog } from './TaxRuleDialog'

export function TaxRulesPage() {
  const qc = useQueryClient()
  const { page, limit, setPage } = usePagination()
  const canView = usePermission('payroll:read')
  // Every write op on tax-rules (create/update/status/delete/restore) is
  // gated `payroll:create` server-side — see TaxRulesController.
  const canManage = usePermission('payroll:create')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState<TaxRule | null>(null)
  const [deleteItem, setDeleteItem] = useState<TaxRule | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['tax-rules', { page, limit }],
    queryFn: () => taxRulesApi.list({ page, limit }),
    enabled: canView,
  })

  const { mutate: del, isPending: deleting } = useMutation({
    mutationFn: (id: string) => taxRulesApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tax-rules'] })
      setDeleteItem(null)
      toast.success('Tax rule deleted.')
    },
    onError: (err) => toast.error(getApiErrorMessage(err, 'Failed to delete tax rule.')),
  })

  const openCreate = () => { setEditItem(null); setDialogOpen(true) }
  const openEdit = (item: TaxRule) => { setEditItem(item); setDialogOpen(true) }

  const rules: TaxRule[] = (data as { data?: TaxRule[] })?.data ?? []
  const meta = (data as { meta?: { total: number; page: number; limit: number; totalPages: number } })?.meta

  const columns: Column<TaxRule>[] = [
    { key: 'name', header: 'Name' },
    { key: 'type', header: 'Type' },
    { key: 'calculationType', header: 'Calculation', render: (r) => r.calculationType.replace(/_/g, ' ') },
    { key: 'applicableOn', header: 'Applied On' },
    { key: 'effectiveFrom', header: 'From', render: (r) => formatDate(r.effectiveFrom) },
    {
      key: 'isStatutory',
      header: 'Statutory',
      render: (r) => r.isStatutory ? <Badge className="bg-secondary text-secondary-foreground border-0 text-[10px]">Yes</Badge> : '—',
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (r) => (
        <Badge className={`border-0 text-[10px] ${r.isActive ? 'bg-accent-green/10 text-accent-green' : 'bg-muted text-muted-foreground'}`}>
          {r.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    ...(canManage
      ? [{
          key: 'actions',
          header: '',
          render: (r: TaxRule) => (
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); openEdit(r) }}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={(e: React.MouseEvent) => { e.stopPropagation(); setDeleteItem(r) }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ),
        } satisfies Column<TaxRule>]
      : []),
  ]

  if (!canView) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Tax Rules</h1>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          You do not have permission to view tax rules.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Receipt className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Tax Rules</h1>
            <p className="text-sm text-muted-foreground">Statutory and custom deduction rules</p>
          </div>
        </div>
        {canManage && (
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Tax Rule
          </Button>
        )}
      </div>

      <DataTable
        columns={columns}
        data={rules}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        rowKey={(r) => r.id}
        emptyMessage="No tax rules configured."
      />

      {canManage && (
        <>
          <TaxRuleDialog open={dialogOpen} onOpenChange={setDialogOpen} editItem={editItem} />

          <ConfirmDialog
            open={!!deleteItem}
            onOpenChange={(o) => !o && setDeleteItem(null)}
            title="Delete Tax Rule"
            description={`Delete "${deleteItem?.name}"? This action cannot be undone.`}
            confirmLabel={deleting ? 'Deleting…' : 'Delete'}
            onConfirm={() => deleteItem && del(deleteItem.id)}
            variant="destructive"
          />
        </>
      )}
    </div>
  )
}
