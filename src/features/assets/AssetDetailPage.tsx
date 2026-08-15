import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Briefcase, UserPlus, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { assetApi } from '@/api/asset.api'
import type { AssetAssignment } from '@/types/asset.types'
import { usePermission } from '@/hooks/usePermission'
import { formatCurrency, formatDate } from '@/lib/utils'
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

export function AssetDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const canAssign = usePermission('asset:assign')
  const canReturn = usePermission('asset:return')

  const [assignOpen, setAssignOpen] = useState(false)
  const [returnOpen, setReturnOpen] = useState(false)

  const { data: asset, isLoading } = useQuery({
    queryKey: ['asset', id],
    queryFn: () => assetApi.get(id as string),
    enabled: !!id,
  })

  const assignmentColumns: Column<AssetAssignment>[] = [
    { key: 'employeeId', header: 'Employee ID', render: (row) => row.employeeId },
    { key: 'assignedAt', header: 'Assigned', render: (row) => formatDate(row.assignedAt) },
    { key: 'returnedAt', header: 'Returned', render: (row) => (row.returnedAt ? formatDate(row.returnedAt) : '—') },
    { key: 'conditionOnIssue', header: 'Condition (Issue)', render: (row) => row.conditionOnIssue ?? '—' },
    { key: 'conditionOnReturn', header: 'Condition (Return)', render: (row) => row.conditionOnReturn ?? '—' },
    { key: 'notes', header: 'Notes', render: (row) => row.notes ?? '—' },
    {
      key: 'recoveredAtExit',
      header: 'Recovered at Exit',
      render: (row) => (
        <Badge className={`border-0 text-xs font-medium ${row.recoveredAtExit ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`} variant="secondary">
          {row.recoveredAtExit ? 'Yes' : 'No'}
        </Badge>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/assets')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
          <Briefcase className="h-5 w-5 text-orange-600" />
        </div>
        <div className="flex-1">
          {isLoading ? (
            <Skeleton className="h-6 w-40" />
          ) : (
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-foreground">{asset?.name ?? 'Asset'}</h1>
              {asset && (
                <Badge className={`border-0 text-xs font-medium ${STATUS_COLORS[asset.status]}`} variant="secondary">
                  {asset.status.replace('_', ' ')}
                </Badge>
              )}
            </div>
          )}
          <p className="text-sm text-muted-foreground">
            {asset ? `${asset.type.replace('_', ' ')} · ${asset.serialNumber ?? 'No serial number'}` : ''}
          </p>
        </div>
        {canAssign && asset?.status === 'AVAILABLE' && (
          <Button onClick={() => setAssignOpen(true)}>
            <UserPlus className="h-4 w-4 mr-1.5" />
            Assign
          </Button>
        )}
        {canReturn && asset?.status === 'ASSIGNED' && (
          <Button variant="outline" onClick={() => setReturnOpen(true)}>
            <Undo2 className="h-4 w-4 mr-1.5" />
            Return
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : asset ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Purchase Date</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{asset.purchaseDate ? formatDate(asset.purchaseDate) : '—'}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Purchase Value</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{asset.purchaseValue != null ? formatCurrency(asset.purchaseValue) : '—'}</p>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-foreground">{asset.assignments?.length ?? 0}</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">Assignment History</h2>
        <DataTable
          columns={assignmentColumns}
          data={asset?.assignments ?? []}
          isLoading={isLoading}
          rowKey={(r) => r.id}
          emptyMessage="No assignment history for this asset."
        />
      </div>

      <AssignAssetDialog open={assignOpen} onOpenChange={setAssignOpen} asset={asset ?? null} />
      <ReturnAssetDialog open={returnOpen} onOpenChange={setReturnOpen} asset={asset ?? null} />
    </div>
  )
}
