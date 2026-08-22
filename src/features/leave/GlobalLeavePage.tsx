import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarRange, Plus, UploadCloud, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { globalLeaveApi } from '@/api/global-leave.api'
import type { GlobalLeave } from '@/types/global-leave.types'
import { usePermission } from '@/hooks/usePermission'
import { formatDate, getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'
import { GlobalLeaveFormDialog } from './GlobalLeaveFormDialog'
import { GlobalLeaveBulkDialog } from './GlobalLeaveBulkDialog'

const CURRENT_YEAR = 2026
const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028]

export function GlobalLeavePage() {
  const qc = useQueryClient()
  const canManage = usePermission('org:update')
  const canRead = usePermission('leave:read')

  const [year, setYear] = useState(CURRENT_YEAR)
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [deleteItem, setDeleteItem] = useState<GlobalLeave | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['global-leaves', { year }],
    queryFn: () => globalLeaveApi.list({ year, limit: 100 }),
    enabled: canRead,
  })

  const items = (data as { data?: GlobalLeave[] })?.data ?? []

  const { mutate: del, isPending: deleting } = useMutation({
    mutationFn: (id: string) => globalLeaveApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['global-leaves'] })
      setDeleteItem(null)
      toast.success('Global leave deleted.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to delete global leave.')),
  })

  const columns: Column<GlobalLeave>[] = [
    { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-foreground">{row.name}</span> },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
    {
      key: 'zones',
      header: 'Applies To',
      render: (row) =>
        row.appliesToAll ? (
          <Badge className="border-0 bg-violet-100 text-violet-700 text-xs font-medium" variant="secondary">
            All employees
          </Badge>
        ) : row.zones.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {row.zones.map((z) => (
              <Badge key={z.id} className="border-0 bg-slate-100 text-slate-700 text-xs font-medium" variant="secondary">
                {z.name}
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        ),
    },
    ...(canManage
      ? [{
          key: 'actions',
          header: '',
          render: (row: GlobalLeave) => (
            <div className="flex gap-1 justify-end">
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
        } as Column<GlobalLeave>]
      : []),
  ]

  if (!canRead) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
            <CalendarRange className="h-5 w-5 text-sky-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Global Leave</h1>
        </div>
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          You do not have permission to view global leave days.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center">
            <CalendarRange className="h-5 w-5 text-sky-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Global Leave</h1>
            <p className="text-sm text-muted-foreground">Company-wide or zone-specific mandatory leave days</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select
            items={Object.fromEntries(YEAR_OPTIONS.map((y) => [String(y), String(y)]))}
            value={String(year)}
            onValueChange={(v) => setYear(Number(v ?? CURRENT_YEAR))}
          >
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canManage && (
            <>
              <Button variant="outline" size="sm" onClick={() => setBulkOpen(true)}>
                <UploadCloud className="h-4 w-4 mr-1.5" />
                Bulk Upload
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-1.5" />
                New Global Leave
              </Button>
            </>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        emptyMessage="No global leave days defined for this year."
      />

      <GlobalLeaveFormDialog open={createOpen} onOpenChange={setCreateOpen} />
      <GlobalLeaveBulkDialog open={bulkOpen} onOpenChange={setBulkOpen} />

      <ConfirmDialog
        open={!!deleteItem}
        onOpenChange={(o) => !o && setDeleteItem(null)}
        title="Delete Global Leave"
        description={`Delete "${deleteItem?.name}" on ${deleteItem ? formatDate(deleteItem.date) : ''}? This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={() => deleteItem && del(deleteItem.id)}
        variant="destructive"
      />
    </div>
  )
}
