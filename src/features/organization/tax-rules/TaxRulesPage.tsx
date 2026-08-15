import { useQuery } from '@tanstack/react-query'
import { Receipt } from 'lucide-react'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { Badge } from '@/components/ui/badge'
import { taxRulesApi } from '@/api/tax-rules.api'
import { formatDate } from '@/lib/utils'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import type { TaxRule } from '@/types/organization.types'

export function TaxRulesPage() {
  const { page, limit, setPage } = usePagination()
  const canView = usePermission('payroll:read')
  const { data, isLoading } = useQuery({
    queryKey: ['tax-rules', { page, limit }],
    queryFn: () => taxRulesApi.list({ page, limit }),
    enabled: canView,
  })

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
      render: (r) => r.isStatutory ? <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">Yes</Badge> : '—',
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (r) => (
        <Badge className={`border-0 text-[10px] ${r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
          {r.isActive ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ]

  if (!canView) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
            <Receipt className="h-5 w-5 text-red-600" />
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
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
          <Receipt className="h-5 w-5 text-red-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Tax Rules</h1>
          <p className="text-sm text-muted-foreground">Statutory and custom deduction rules</p>
        </div>
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
    </div>
  )
}
