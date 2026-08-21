import { apiClient, unwrap } from './client'
import type { TaxRule, CreateTaxRuleDto } from '@/types/organization.types'
import type { PaginationParams } from '@/types/api.types'

interface TaxRuleParams extends PaginationParams {
  type?: string
  isActive?: boolean
  isStatutory?: boolean
}

export const taxRulesApi = {
  list: (params?: TaxRuleParams) =>
    apiClient.get('/tax-rules', { params }).then(unwrap),

  trash: (params?: PaginationParams) =>
    apiClient.get('/tax-rules/trash', { params }).then(unwrap),

  meta: () => apiClient.get('/tax-rules/meta').then(unwrap),

  get: (id: string) =>
    apiClient.get<{ data: TaxRule }>(`/tax-rules/${id}`).then(unwrap<TaxRule>),

  create: (data: CreateTaxRuleDto) =>
    apiClient.post<{ data: TaxRule }>('/tax-rules', data).then(unwrap<TaxRule>),

  update: (id: string, data: Partial<CreateTaxRuleDto>) =>
    apiClient.put<{ data: TaxRule }>(`/tax-rules/${id}`, data).then(unwrap<TaxRule>),

  patchStatus: (id: string, isActive: boolean) =>
    apiClient.patch(`/tax-rules/${id}/status`, { isActive }).then(unwrap),

  delete: (id: string) => apiClient.delete(`/tax-rules/${id}`).then(unwrap),

  restore: (id: string) => apiClient.patch(`/tax-rules/${id}/restore`).then(unwrap),
}
