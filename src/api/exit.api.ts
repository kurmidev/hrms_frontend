import { apiClient, unwrap } from './client'
import type { ExitRecord, CreateExitDto, UpdateClearanceDto, SettleExitDto, ExitSettlementSummary } from '@/types/exit.types'
import type { PaginationParams } from '@/types/api.types'

interface ExitParams extends PaginationParams {
  employeeId?: string
  type?: string
  status?: string
}

export const exitApi = {
  list: (params?: ExitParams) =>
    apiClient.get('/exit', { params }).then(unwrap),

  get: (id: string) =>
    apiClient.get<{ data: ExitRecord }>(`/exit/${id}`).then(unwrap<ExitRecord>),

  initiate: (data: CreateExitDto) =>
    apiClient.post<{ data: ExitRecord }>('/exit', data).then(unwrap<ExitRecord>),

  updateClearance: (id: string, data: UpdateClearanceDto) =>
    apiClient.put<{ data: ExitRecord }>(`/exit/${id}/clearance`, data).then(unwrap<ExitRecord>),

  settle: (id: string, data: SettleExitDto) =>
    apiClient.put<{ data: ExitSettlementSummary }>(`/exit/${id}/settle`, data).then(unwrap<ExitSettlementSummary>),
}
