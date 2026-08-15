import { apiClient, unwrap } from './client'
import type {
  ServiceRequest,
  CreateServiceRequestDto,
  AssignServiceRequestDto,
  ResolveServiceRequestDto,
  UpdateServiceRequestStatusDto,
  CreateServiceRequestCommentDto,
} from '@/types/service-request.types'
import type { PaginationParams } from '@/types/api.types'

interface ServiceRequestParams extends PaginationParams {
  status?: string
  category?: string
  priority?: string
  assignedTo?: string
}

export const serviceRequestApi = {
  list: (params?: ServiceRequestParams) =>
    apiClient.get('/service-requests', { params }).then(unwrap),

  settings: () =>
    apiClient
      .get<{ data: { allowAnonymousServiceRequests: boolean } }>('/service-requests/settings')
      .then(unwrap<{ allowAnonymousServiceRequests: boolean }>),

  get: (id: string) =>
    apiClient.get<{ data: ServiceRequest }>(`/service-requests/${id}`).then(unwrap<ServiceRequest>),

  create: (data: CreateServiceRequestDto) =>
    apiClient.post<{ data: ServiceRequest }>('/service-requests', data).then(unwrap<ServiceRequest>),

  assign: (id: string, data: AssignServiceRequestDto) =>
    apiClient.put<{ data: ServiceRequest }>(`/service-requests/${id}/assign`, data).then(unwrap<ServiceRequest>),

  resolve: (id: string, data: ResolveServiceRequestDto) =>
    apiClient.put<{ data: ServiceRequest }>(`/service-requests/${id}/resolve`, data).then(unwrap<ServiceRequest>),

  updateStatus: (id: string, data: UpdateServiceRequestStatusDto) =>
    apiClient.put<{ data: ServiceRequest }>(`/service-requests/${id}/status`, data).then(unwrap<ServiceRequest>),

  addComment: (id: string, data: CreateServiceRequestCommentDto) =>
    apiClient.post<{ data: ServiceRequest }>(`/service-requests/${id}/comments`, data).then(unwrap<ServiceRequest>),
}
