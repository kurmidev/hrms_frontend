import { apiClient, unwrap } from './client'
import type {
  GreenThanks,
  CreateGreenThanksInput,
  ApproveGreenThanksInput,
  GreenThanksConfig,
  UpdateGreenThanksConfigInput,
  GreenThanksDirection,
  GreenThanksStatus,
  GreenThanksEmployeeRef,
} from '@/types/green-thanks.types'
import type { PaginationParams } from '@/types/api.types'

interface GreenThanksParams extends PaginationParams {
  direction?: GreenThanksDirection
  status?: GreenThanksStatus
  employeeId?: string
}

export const greenThanksApi = {
  list: (params?: GreenThanksParams) =>
    apiClient.get('/green-thanks', { params }).then(unwrap),

  listRecipients: () =>
    apiClient.get<{ data: GreenThanksEmployeeRef[] }>('/green-thanks/recipients').then(unwrap<GreenThanksEmployeeRef[]>),

  send: (data: CreateGreenThanksInput) =>
    apiClient.post<{ data: GreenThanks }>('/green-thanks', data).then(unwrap<GreenThanks>),

  approve: (id: string, data: ApproveGreenThanksInput) =>
    apiClient.put<{ data: GreenThanks }>(`/green-thanks/${id}/approve`, data).then(unwrap<GreenThanks>),

  getConfig: () =>
    apiClient.get<{ data: GreenThanksConfig }>('/green-thanks/config').then(unwrap<GreenThanksConfig>),

  updateConfig: (data: UpdateGreenThanksConfigInput) =>
    apiClient.put<{ data: GreenThanksConfig }>('/green-thanks/config', data).then(unwrap<GreenThanksConfig>),
}
