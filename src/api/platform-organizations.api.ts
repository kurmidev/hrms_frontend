import { platformClient, platformUnwrap } from './platform-client'
import type { PlatformOrg } from '@/types/platform.types'

interface RegisterOrgDto {
  name: string
  slug?: string
  email: string
  phone?: string
  address?: string
  logoUrl?: string
  planId: string
  billingCycle: string
  gracePeriodDays?: number
  taxPercent?: number
  dueAfterDays?: number
  adminEmail: string
  adminName?: string
}

export const platformOrgsApi = {
  list: (params?: { page?: number; limit?: number }) =>
    platformClient
      .get<{
        data: { data: PlatformOrg[]; meta: { total: number; page: number; limit: number; totalPages: number } }
      }>('/platform/organizations', { params })
      .then((r) => r.data.data),
  get: (id: string) =>
    platformClient
      .get<{ data: PlatformOrg }>(`/platform/organizations/${id}`)
      .then((r) => platformUnwrap<PlatformOrg>(r)),
  register: (data: RegisterOrgDto) =>
    platformClient
      .post<{ data: { organization: PlatformOrg; tempPassword: string; invoice: unknown } }>(
        '/platform/organizations',
        data
      )
      .then((r) => r.data.data),
  update: (id: string, data: Partial<PlatformOrg>) =>
    platformClient
      .put<{ data: PlatformOrg }>(`/platform/organizations/${id}`, data)
      .then((r) => platformUnwrap<PlatformOrg>(r)),
  suspend: (id: string) => platformClient.put(`/platform/organizations/${id}/suspend`),
  activate: (id: string) => platformClient.put(`/platform/organizations/${id}/activate`),
}
