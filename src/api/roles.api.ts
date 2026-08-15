import { apiClient, unwrap } from './client'
import type { Role } from '@/types/organization.types'

export const rolesApi = {
  list: () => apiClient.get<{ data: Role[] }>('/roles').then(unwrap<Role[]>),

  get: (id: string) => apiClient.get<{ data: Role }>(`/roles/${id}`).then(unwrap<Role>),

  create: (data: { name: string; description?: string; permissions: string[] }) =>
    apiClient.post<{ data: Role }>('/roles', data).then(unwrap<Role>),

  update: (id: string, data: { name?: string; description?: string; permissions?: string[] }) =>
    apiClient.put<{ data: Role }>(`/roles/${id}`, data).then(unwrap<Role>),

  delete: (id: string) => apiClient.delete(`/roles/${id}`).then(unwrap),

  assign: (data: { userId: string; roleId: string }) =>
    apiClient.post('/roles/assign', data).then(unwrap),

  unassign: (userId: string, roleId: string) =>
    apiClient.delete(`/roles/assign/${userId}/${roleId}`).then(unwrap),

  userRoles: (userId: string) =>
    apiClient.get(`/roles/users/${userId}`).then(unwrap),
}
