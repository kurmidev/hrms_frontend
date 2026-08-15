import { apiClient, unwrap } from './client'
import type { Designation } from '@/types/organization.types'
import type { PaginationParams } from '@/types/api.types'

interface DesignationParams extends PaginationParams {
  departmentId?: string
  isActive?: boolean
}

export const designationsApi = {
  list: (params?: DesignationParams) =>
    apiClient.get('/designations', { params }).then(unwrap),

  forAssignment: () =>
    apiClient.get<{ data: Designation[] }>('/designations/for-assignment').then(unwrap<Designation[]>),

  trash: (params?: PaginationParams) =>
    apiClient.get('/designations/trash', { params }).then(unwrap),

  get: (id: string) =>
    apiClient.get<{ data: Designation }>(`/designations/${id}`).then(unwrap<Designation>),

  create: (data: { name: string; departmentId: string; level?: number; payrollStructureId?: string }) =>
    apiClient.post<{ data: Designation }>('/designations', data).then(unwrap<Designation>),

  update: (id: string, data: Partial<{ name: string; departmentId: string; level: number; payrollStructureId: string }>) =>
    apiClient.put<{ data: Designation }>(`/designations/${id}`, data).then(unwrap<Designation>),

  delete: (id: string) => apiClient.delete(`/designations/${id}`).then(unwrap),

  restore: (id: string) => apiClient.patch(`/designations/${id}/restore`).then(unwrap),
}
