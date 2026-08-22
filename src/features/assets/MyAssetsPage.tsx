import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Briefcase } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { assetApi } from '@/api/asset.api'
import type { AssetAssignment } from '@/types/asset.types'
import { useAuthStore } from '@/store/auth.store'
import { formatDate } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-accent-green/10 text-accent-green',
  ASSIGNED: 'bg-secondary text-secondary-foreground',
  UNDER_MAINTENANCE: 'bg-accent-orange/10 text-accent-orange',
  RETIRED: 'bg-muted text-muted-foreground',
  RETURNED: 'bg-secondary text-secondary-foreground',
  DAMAGED: 'bg-accent-red/10 text-accent-red',
  LOST: 'bg-accent-red/10 text-accent-red',
}

export function MyAssetsPage() {
  const navigate = useNavigate()
  const employeeId = useAuthStore((s) => s.user?.employee?.id)

  const { data, isLoading } = useQuery({
    queryKey: ['asset-history', employeeId],
    queryFn: () => assetApi.employeeHistory(employeeId as string),
    enabled: !!employeeId,
  })

  const rows = data ?? []

  const columns: Column<AssetAssignment>[] = [
    {
      key: 'asset',
      header: 'Asset',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-foreground">{row.asset?.name ?? '—'}</p>
          <p className="text-xs text-muted-foreground">{row.asset?.serialNumber ?? '—'}</p>
        </div>
      ),
    },
    { key: 'type', header: 'Type', render: (row) => row.asset?.type.replace('_', ' ') ?? '—' },
    {
      key: 'status',
      header: 'Current Status',
      render: (row) =>
        row.asset ? (
          <Badge className={`border-0 text-xs font-medium ${STATUS_COLORS[row.asset.status]}`} variant="secondary">
            {row.asset.status.replace('_', ' ')}
          </Badge>
        ) : (
          '—'
        ),
    },
    { key: 'assignedAt', header: 'Assigned', render: (row) => formatDate(row.assignedAt) },
    { key: 'returnedAt', header: 'Returned', render: (row) => (row.returnedAt ? formatDate(row.returnedAt) : '—') },
    { key: 'conditionOnIssue', header: 'Condition (Issue)', render: (row) => row.conditionOnIssue ?? '—' },
    { key: 'conditionOnReturn', header: 'Condition (Return)', render: (row) => row.conditionOnReturn ?? '—' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Briefcase className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">My Assets</h1>
          <p className="text-sm text-muted-foreground">{rows.length} assignment records</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        onRowClick={(row) => row.asset && navigate(`/assets/${row.asset.id}`)}
        emptyMessage="No assets have been issued to you yet."
      />
    </div>
  )
}
