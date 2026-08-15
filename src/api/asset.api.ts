import { apiClient, unwrap } from './client'
import type {
  Asset,
  AssetAssignment,
  CreateAssetDto,
  AssignAssetDto,
  ReturnAssetDto,
} from '@/types/asset.types'
import type { PaginationParams } from '@/types/api.types'

interface AssetParams extends PaginationParams {
  type?: string
  status?: string
}

export const assetApi = {
  list: (params?: AssetParams) =>
    apiClient.get('/assets', { params }).then(unwrap),

  get: (id: string) =>
    apiClient.get<{ data: Asset }>(`/assets/${id}`).then(unwrap<Asset>),

  create: (data: CreateAssetDto) =>
    apiClient.post<{ data: Asset }>('/assets', data).then(unwrap<Asset>),

  update: (id: string, data: Partial<CreateAssetDto>) =>
    apiClient.put<{ data: Asset }>(`/assets/${id}`, data).then(unwrap<Asset>),

  assign: (id: string, data: AssignAssetDto) =>
    apiClient.post<{ data: Asset }>(`/assets/${id}/assign`, data).then(unwrap<Asset>),

  return: (id: string, data: ReturnAssetDto) =>
    apiClient.put<{ data: Asset }>(`/assets/${id}/return`, data).then(unwrap<Asset>),

  employeeHistory: (employeeId: string) =>
    apiClient
      .get<{ data: AssetAssignment[] }>(`/assets/employee/${employeeId}/history`)
      .then(unwrap<AssetAssignment[]>),
}
