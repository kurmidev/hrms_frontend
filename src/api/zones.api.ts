import { apiClient, unwrap } from './client'
import type { Zone, CreateZoneDto, UpdateZoneDto } from '@/types/zone.types'
import type { PaginationParams } from '@/types/api.types'

interface ZoneParams extends PaginationParams {
  isActive?: boolean
}

export const zonesApi = {
  list: (params?: ZoneParams) =>
    apiClient.get('/zones', { params }).then(unwrap),

  get: (id: string) =>
    apiClient.get<{ data: Zone }>(`/zones/${id}`).then(unwrap<Zone>),

  create: (data: CreateZoneDto) =>
    apiClient.post<{ data: Zone }>('/zones', data).then(unwrap<Zone>),

  update: (id: string, data: UpdateZoneDto) =>
    apiClient.put<{ data: Zone }>(`/zones/${id}`, data).then(unwrap<Zone>),

  delete: (id: string) =>
    apiClient.delete(`/zones/${id}`).then(unwrap),
}
