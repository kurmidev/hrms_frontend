import { apiClient, unwrap } from './client'
import type { OdRecord, CreateOdDto, AddOdLocationDto } from '@/types/od.types'
import type { PaginationParams } from '@/types/api.types'

interface OdParams extends PaginationParams {
  employeeId?: string
  date?: string
}

export const odApi = {
  list: (params?: OdParams) =>
    apiClient.get('/attendance/od', { params }).then(unwrap),

  create: (data: CreateOdDto) =>
    apiClient.post<{ data: OdRecord }>('/attendance/od', data).then(unwrap<OdRecord>),

  addLocation: (id: string, data: AddOdLocationDto) =>
    apiClient.post<{ data: OdRecord }>(`/attendance/od/${id}/locations`, data).then(unwrap<OdRecord>),
}
