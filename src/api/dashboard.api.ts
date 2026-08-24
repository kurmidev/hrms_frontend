import { apiClient, unwrap } from './client'
import type { DashboardAdminAlerts, DashboardConfig, DashboardLoanLeaveSummary } from '@/types/dashboard.types'
import type { DashboardKpis } from '@/types/reports.types'

export const dashboardApi = {
  kpis: () =>
    apiClient.get<{ data: DashboardKpis }>('/dashboards/kpis').then((r) => unwrap<DashboardKpis>(r)),

  loanLeaveSummary: () =>
    apiClient
      .get<{ data: DashboardLoanLeaveSummary }>('/dashboards/loan-leave-summary')
      .then((r) => unwrap<DashboardLoanLeaveSummary>(r)),

  adminAlerts: () =>
    apiClient
      .get<{ data: DashboardAdminAlerts }>('/dashboards/admin-alerts')
      .then((r) => unwrap<DashboardAdminAlerts>(r)),

  list: () =>
    apiClient.get<{ data: DashboardConfig[] }>('/dashboards').then((r) => unwrap<DashboardConfig[]>(r)),
  getDefaults: () =>
    apiClient
      .get<{ data: DashboardConfig[] }>('/dashboards/defaults')
      .then((r) => unwrap<DashboardConfig[]>(r)),
  create: (data: Partial<DashboardConfig>) =>
    apiClient
      .post<{ data: DashboardConfig }>('/dashboards', data)
      .then((r) => unwrap<DashboardConfig>(r)),
  update: (id: string, data: Partial<DashboardConfig>) =>
    apiClient
      .put<{ data: DashboardConfig }>(`/dashboards/${id}`, data)
      .then((r) => unwrap<DashboardConfig>(r)),
  delete: (id: string) => apiClient.delete(`/dashboards/${id}`),
  seedDefaults: () => apiClient.post('/dashboards/seed-defaults'),
}
