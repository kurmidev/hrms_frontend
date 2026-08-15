import { useQuery } from '@tanstack/react-query'
import { CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { payrollStructuresApi } from '@/api/payroll-structures.api'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import type { PayrollStructure } from '@/types/organization.types'

export function PayrollStructuresPage() {
  const { page, limit } = usePagination()
  const canView = usePermission('payroll:read')
  const { data, isLoading } = useQuery({
    queryKey: ['payroll-structures', { page, limit }],
    queryFn: () => payrollStructuresApi.list({ page, limit }),
    enabled: canView,
  })

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
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <CreditCard className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Payroll Structures</h1>
          <p className="text-sm text-muted-foreground">Salary component configurations</p>
        </div>
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
                  <Badge variant="secondary" className={`text-[10px] border-0 ${s.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                    {s.isActive ? 'Active' : 'Inactive'}
                  </Badge>
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
    </div>
  )
}
