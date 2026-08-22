import { apiClient, unwrap } from './client'
import type {
  GlobalLeave,
  CreateGlobalLeaveDto,
  BulkCreateGlobalLeaveDto,
  BulkGlobalLeaveResult,
} from '@/types/global-leave.types'
import type { PaginationParams } from '@/types/api.types'

interface GlobalLeaveParams extends PaginationParams {
  year?: number
}

export const globalLeaveApi = {
  list: (params?: GlobalLeaveParams) =>
    apiClient.get('/leave/global-leaves', { params }).then(unwrap),

  create: (data: CreateGlobalLeaveDto) =>
    apiClient.post<{ data: GlobalLeave }>('/leave/global-leaves', data).then(unwrap<GlobalLeave>),

  bulkCreate: (data: BulkCreateGlobalLeaveDto) =>
    apiClient
      .post<{ data: BulkGlobalLeaveResult }>('/leave/global-leaves/bulk', data)
      .then(unwrap<BulkGlobalLeaveResult>),

  delete: (id: string) =>
    apiClient.delete(`/leave/global-leaves/${id}`).then(unwrap),

  my: (year?: number) =>
    apiClient
      .get<{ data: GlobalLeave[] }>('/leave/global-leaves/my', { params: { year } })
      .then(unwrap<GlobalLeave[]>),
}
