import { platformClient, platformUnwrap } from './platform-client'
import type { Invoice } from '@/types/platform.types'

interface MarkPaidDto {
  paymentDate: string
  paymentMethod: string
  referenceNumber?: string
  notes?: string
  amount: number
  recordedById: string
}

export const platformInvoicesApi = {
  list: (params?: { orgId?: string; status?: string; page?: number; limit?: number }) =>
    platformClient
      .get<{ data: { items: Invoice[]; total: number } }>('/platform/invoices', { params })
      .then((r) => r.data.data),
  listByOrg: (orgId: string) =>
    platformClient
      .get<{ data: Invoice[] }>(`/platform/organizations/${orgId}/invoices`)
      .then((r) => platformUnwrap<Invoice[]>(r)),
  markPaid: (id: string, data: MarkPaidDto) =>
    platformClient.put(`/platform/invoices/${id}/mark-paid`, data),
  void: (id: string) => platformClient.put(`/platform/invoices/${id}/void`),
}
