import { apiClient, unwrap } from './client'
import type {
  WorkLocation,
  CreateWorkLocationDto,
  UpdateWorkLocationDto,
} from '@/types/work-location.types'
import type { PaginationParams } from '@/types/api.types'

interface WorkLocationParams extends PaginationParams {
  isActive?: boolean
}

export const workLocationsApi = {
  list: (params?: WorkLocationParams) =>
    apiClient.get('/work-locations', { params }).then(unwrap),

  get: (id: string) =>
    apiClient.get<{ data: WorkLocation }>(`/work-locations/${id}`).then(unwrap<WorkLocation>),

  create: (data: CreateWorkLocationDto) =>
    apiClient.post<{ data: WorkLocation }>('/work-locations', data).then(unwrap<WorkLocation>),

  update: (id: string, data: UpdateWorkLocationDto) =>
    apiClient.put<{ data: WorkLocation }>(`/work-locations/${id}`, data).then(unwrap<WorkLocation>),

  delete: (id: string) =>
    apiClient.delete(`/work-locations/${id}`).then(unwrap),
}
