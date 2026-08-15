import { apiClient, unwrap } from './client'
import type { Department, DepartmentTreeNode } from '@/types/organization.types'
import type { PaginationParams } from '@/types/api.types'

interface DepartmentParams extends PaginationParams {
  isActive?: boolean
}

export const departmentsApi = {
  list: (params?: DepartmentParams) =>
    apiClient.get('/departments', { params }).then(unwrap),

  tree: () =>
    apiClient.get<{ data: DepartmentTreeNode[] }>('/departments/tree').then(unwrap<DepartmentTreeNode[]>),

  trash: (params?: PaginationParams) =>
    apiClient.get('/departments/trash', { params }).then(unwrap),

  get: (id: string) =>
    apiClient.get<{ data: Department }>(`/departments/${id}`).then(unwrap<Department>),

  create: (data: { name: string; parentId?: string }) =>
    apiClient.post<{ data: Department }>('/departments', data).then(unwrap<Department>),

  update: (id: string, data: { name?: string; headEmployeeId?: string }) =>
    apiClient.put<{ data: Department }>(`/departments/${id}`, data).then(unwrap<Department>),

  move: (id: string, newParentId: string | null) =>
    apiClient.patch<{ data: Department }>(`/departments/${id}/move`, { newParentId }).then(unwrap<Department>),

  delete: (id: string) => apiClient.delete(`/departments/${id}`).then(unwrap),

  restore: (id: string) => apiClient.patch(`/departments/${id}/restore`).then(unwrap),
}
