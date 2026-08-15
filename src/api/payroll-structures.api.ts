import { apiClient, unwrap } from './client'
import type { PayrollStructure } from '@/types/organization.types'
import type { PaginationParams } from '@/types/api.types'

export const payrollStructuresApi = {
  list: (params?: PaginationParams) =>
    apiClient.get('/payroll-structures', { params }).then(unwrap),

  trash: (params?: PaginationParams) =>
    apiClient.get('/payroll-structures/trash', { params }).then(unwrap),

  get: (id: string) =>
    apiClient.get<{ data: PayrollStructure }>(`/payroll-structures/${id}`).then(unwrap<PayrollStructure>),

  create: (data: { name: string; components: PayrollStructure['components'] }) =>
    apiClient.post<{ data: PayrollStructure }>('/payroll-structures', data).then(unwrap<PayrollStructure>),

  update: (id: string, data: Partial<PayrollStructure>) =>
    apiClient.put<{ data: PayrollStructure }>(`/payroll-structures/${id}`, data).then(unwrap<PayrollStructure>),

  delete: (id: string) => apiClient.delete(`/payroll-structures/${id}`).then(unwrap),

  restore: (id: string) => apiClient.patch(`/payroll-structures/${id}/restore`).then(unwrap),
}
