import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Briefcase, Plus, UserPlus, Undo2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { assetApi } from '@/api/asset.api'
import type { Asset, AssetStatus, AssetType } from '@/types/asset.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { formatCurrency, formatDate } from '@/lib/utils'
import { AssetFormDialog } from './AssetFormDialog'
import { AssignAssetDialog } from './AssignAssetDialog'
import { ReturnAssetDialog } from './ReturnAssetDialog'

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  ASSIGNED: 'bg-blue-100 text-blue-700',
  UNDER_MAINTENANCE: 'bg-amber-100 text-amber-700',
  RETIRED: 'bg-gray-200 text-gray-700',
  RETURNED: 'bg-slate-100 text-slate-600',
  DAMAGED: 'bg-red-100 text-red-700',
  LOST: 'bg-red-100 text-red-700',
}

const ASSET_TYPES: AssetType[] = ['LAPTOP', 'ID_CARD', 'SIM', 'VEHICLE', 'OTHER']
const ASSET_STATUSES: AssetStatus[] = ['AVAILABLE', 'ASSIGNED', 'UNDER_MAINTENANCE', 'RETIRED']

export function AssetsPage() {
  const navigate = useNavigate()
  const { page, limit, setPage } = usePagination()
  const canAssign = usePermission('asset:assign')
  const canReturn = usePermission('asset:return')

  const [type, setType] = useState<AssetType | ''>('')
  const [status, setStatus] = useState<AssetStatus | ''>('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Asset | null>(null)
  const [assignTarget, setAssignTarget] = useState<Asset | null>(null)
  const [returnTarget, setReturnTarget] = useState<Asset | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['assets', { page, limit, type, status }],
    queryFn: () => assetApi.list({ page, limit, type: type || undefined, status: status || undefined }),
  })

  const rows = (data as { data?: Asset[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const columns: Column<Asset>[] = [
    {
      key: 'name',
      header: 'Asset',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-foreground">{row.name}</p>
          <p className="text-xs text-muted-foreground">{row.serialNumber ?? '—'}</p>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (row) => row.type.replace('_', ' ') },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge className={`border-0 text-xs font-medium ${STATUS_COLORS[row.status]}`} variant="secondary">
          {row.status.replace('_', ' ')}
        </Badge>
      ),
    },
    { key: 'purchaseDate', header: 'Purchased', render: (row) => (row.purchaseDate ? formatDate(row.purchaseDate) : '—') },
    { key: 'purchaseValue', header: 'Value', render: (row) => (row.purchaseValue != null ? formatCurrency(row.purchaseValue) : '—') },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          {canAssign && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                setEditTarget(row)
                setFormOpen(true)
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {canAssign && row.status === 'AVAILABLE' && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                setAssignTarget(row)
              }}
            >
              <UserPlus className="h-3.5 w-3.5 mr-1" />
              Assign
            </Button>
          )}
          {canReturn && row.status === 'ASSIGNED' && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                setReturnTarget(row)
              }}
            >
              <Undo2 className="h-3.5 w-3.5 mr-1" />
              Return
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Assets</h1>
            <p className="text-sm text-muted-foreground">{meta?.total ?? 0} assets</p>
          </div>
        </div>
        {canAssign && (
          <Button
            size="sm"
            onClick={() => {
              setEditTarget(null)
              setFormOpen(true)
            }}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            New Asset
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Select value={type} onValueChange={(v) => setType((v as AssetType) ?? '')}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All types</SelectItem>
            {ASSET_TYPES.map((t) => (
              <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={(v) => setStatus((v as AssetStatus) ?? '')}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            {ASSET_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        onRowClick={(row) => navigate(`/assets/${row.id}`)}
        rowKey={(r) => r.id}
        emptyMessage="No assets found."
      />

      {canAssign && (
        <AssetFormDialog
          open={formOpen}
          onOpenChange={(o) => {
            setFormOpen(o)
            if (!o) setEditTarget(null)
          }}
          asset={editTarget}
        />
      )}
      {canAssign && (
        <AssignAssetDialog open={!!assignTarget} onOpenChange={(o) => !o && setAssignTarget(null)} asset={assignTarget} />
      )}
      {canReturn && (
        <ReturnAssetDialog open={!!returnTarget} onOpenChange={(o) => !o && setReturnTarget(null)} asset={returnTarget} />
      )}
    </div>
  )
}
