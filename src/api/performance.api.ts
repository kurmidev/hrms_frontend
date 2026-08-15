import { apiClient, unwrap } from './client'
import type {
  PerformanceCycle,
  PerformanceRating,
  CreatePerformanceCycleDto,
  SubmitRatingDto,
} from '@/types/performance.types'
import type { PaginationParams } from '@/types/api.types'

interface CycleParams extends PaginationParams {
  status?: string
}

export const performanceApi = {
  listCycles: (params?: CycleParams) =>
    apiClient.get('/performance/cycles', { params }).then(unwrap),

  getCycle: (id: string) =>
    apiClient.get<{ data: PerformanceCycle }>(`/performance/cycles/${id}`).then(unwrap<PerformanceCycle>),

  createCycle: (data: CreatePerformanceCycleDto) =>
    apiClient.post<{ data: PerformanceCycle }>('/performance/cycles', data).then(unwrap<PerformanceCycle>),

  activateCycle: (id: string) =>
    apiClient.put<{ data: PerformanceCycle }>(`/performance/cycles/${id}/activate`).then(unwrap<PerformanceCycle>),

  closeCycle: (id: string) =>
    apiClient.put<{ data: PerformanceCycle }>(`/performance/cycles/${id}/close`).then(unwrap<PerformanceCycle>),

  listRatings: (cycleId: string, params?: PaginationParams) =>
    apiClient.get(`/performance/cycles/${cycleId}/ratings`, { params }).then(unwrap),

  submitRating: (cycleId: string, data: SubmitRatingDto) =>
    apiClient.post<{ data: PerformanceRating }>(`/performance/cycles/${cycleId}/ratings`, data).then(unwrap<PerformanceRating>),

  myRatings: (params?: PaginationParams) =>
    apiClient.get('/performance/my-ratings', { params }).then(unwrap),
}
