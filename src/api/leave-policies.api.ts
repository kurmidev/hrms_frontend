import { apiClient, unwrap } from './client'
import type { LeavePolicy } from '@/types/organization.types'
import type { PaginationParams } from '@/types/api.types'

interface LeavePolicyParams extends PaginationParams {
  leaveType?: string
  isActive?: boolean
}

export const leavePoliciesApi = {
  list: (params?: LeavePolicyParams) =>
    apiClient.get('/leave-policies', { params }).then(unwrap),

  trash: (params?: PaginationParams) =>
    apiClient.get('/leave-policies/trash', { params }).then(unwrap),

  get: (id: string) =>
    apiClient.get<{ data: LeavePolicy }>(`/leave-policies/${id}`).then(unwrap<LeavePolicy>),

  create: (data: Partial<LeavePolicy>) =>
    apiClient.post<{ data: LeavePolicy }>('/leave-policies', data).then(unwrap<LeavePolicy>),

  update: (id: string, data: Partial<LeavePolicy>) =>
    apiClient.put<{ data: LeavePolicy }>(`/leave-policies/${id}`, data).then(unwrap<LeavePolicy>),

  delete: (id: string) => apiClient.delete(`/leave-policies/${id}`).then(unwrap),

  restore: (id: string) => apiClient.patch(`/leave-policies/${id}/restore`).then(unwrap),

  createRule: (policyId: string, data: Record<string, unknown>) =>
    apiClient.post(`/leave-policies/${policyId}/rules`, data).then(unwrap),

  listRules: (policyId: string) =>
    apiClient.get(`/leave-policies/${policyId}/rules`).then(unwrap),

  deleteRule: (policyId: string, ruleId: string) =>
    apiClient.delete(`/leave-policies/${policyId}/rules/${ruleId}`).then(unwrap),
}
