import { apiClient, unwrap } from './client'
import type { OnboardingLink, CreateOnboardingLinkDto, ApproveOnboardingDto } from '@/types/onboarding.types'
import type { PaginationParams } from '@/types/api.types'

interface OnboardingParams extends PaginationParams {
  status?: string
  email?: string
}

export const onboardingApi = {
  // HR endpoints
  list: (params?: OnboardingParams) =>
    apiClient.get('/onboarding-links', { params }).then(unwrap),

  get: (id: string) =>
    apiClient.get<{ data: OnboardingLink }>(`/onboarding-links/${id}`).then(unwrap<OnboardingLink>),

  create: (data: CreateOnboardingLinkDto) =>
    apiClient.post<{ data: OnboardingLink }>('/onboarding-links', data).then(unwrap<OnboardingLink>),

  review: (id: string) =>
    apiClient.post(`/onboarding-links/${id}/review`).then(unwrap),

  requestChanges: (id: string, notes: string) =>
    apiClient.post(`/onboarding-links/${id}/request-changes`, { notes }).then(unwrap),

  reject: (id: string, notes?: string) =>
    apiClient.post(`/onboarding-links/${id}/reject`, { notes }).then(unwrap),

  approve: (id: string, data: ApproveOnboardingDto) =>
    apiClient.post(`/onboarding-links/${id}/approve`, data).then(unwrap),

  revoke: (id: string) =>
    apiClient.delete(`/onboarding-links/${id}`).then(unwrap),

  // Public / candidate endpoints
  getPublic: (token: string) =>
    apiClient.get(`/onboarding/public/${token}`).then(unwrap),

  submitDetails: (token: string, data: Record<string, unknown>) =>
    apiClient.put(`/onboarding/public/${token}/details`, data).then(unwrap),

  submitDocuments: (token: string, formData: FormData) =>
    apiClient.post(`/onboarding/public/${token}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap),
}
