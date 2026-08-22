import { useQuery } from '@tanstack/react-query'
import { platformOrgsApi } from '@/api/platform-organizations.api'
import { platformInvoicesApi } from '@/api/platform-invoices.api'
import { Building2, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react'

export function PlatformDashboardPage() {
  const { data: orgsData } = useQuery({
    queryKey: ['platform', 'orgs'],
    queryFn: () => platformOrgsApi.list({ page: 1, limit: 100 }),
  })
  const { data: invoicesData } = useQuery({
    queryKey: ['platform', 'invoices', 'overdue'],
    queryFn: () => platformInvoicesApi.list({ status: 'OVERDUE', limit: 100 }),
  })

  const orgs = orgsData?.data ?? []
  const total = orgsData?.meta.total ?? 0
  const active = orgs.filter((o) => o.isActive).length
  const suspended = orgs.filter((o) => o.subscription?.status === 'SUSPENDED').length
  const overdue = invoicesData?.total ?? 0

  const stats = [
    {
      label: 'Total Organizations',
      value: total,
      icon: Building2,
      color: 'text-[var(--platform-accent)]',
      bg: 'bg-[var(--platform-accent-tint)]',
    },
    {
      label: 'Active Organizations',
      value: active,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Overdue Invoices',
      value: overdue,
      icon: AlertTriangle,
      color: 'text-yellow-600',
      bg: 'bg-yellow-100',
    },
    {
      label: 'Suspended',
      value: suspended,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Dashboard</h1>
        <p className="text-[var(--platform-muted)] text-sm mt-1">Overview of all organizations and subscriptions</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <div key={s.label} className="bg-[var(--platform-surface)] border border-[var(--platform-border)] rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-[var(--platform-muted)]">{s.label}</p>
                  <p className="text-3xl font-bold text-white mt-1">{s.value}</p>
                </div>
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.bg}`}
                >
                  <Icon className={`h-6 w-6 ${s.color}`} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="bg-[var(--platform-surface)] border border-[var(--platform-border)] rounded-xl">
        <div className="px-5 py-4 border-b border-[var(--platform-border)]">
          <h2 className="text-sm font-semibold text-white">Recent Organizations</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--platform-border)]">
                <th className="text-left px-5 py-3 text-[var(--platform-muted)] font-medium">Name</th>
                <th className="text-left px-5 py-3 text-[var(--platform-muted)] font-medium">Email</th>
                <th className="text-left px-5 py-3 text-[var(--platform-muted)] font-medium">Plan</th>
                <th className="text-left px-5 py-3 text-[var(--platform-muted)] font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orgs.slice(0, 10).map((org) => (
                <tr key={org.id} className="border-b border-[var(--platform-border)] hover:bg-[var(--platform-raised)]">
                  <td className="px-5 py-3 text-white font-medium">{org.name}</td>
                  <td className="px-5 py-3 text-[var(--platform-muted)]">{org.email ?? '—'}</td>
                  <td className="px-5 py-3 text-[var(--platform-muted)]">
                    {org.subscription?.plan?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${org.isActive ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}
                    >
                      {org.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
              ))}
              {orgs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-[var(--platform-muted)]">
                    No organizations yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
