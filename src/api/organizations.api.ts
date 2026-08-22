import { apiClient, unwrap } from './client'
import type { Organization, Currency } from '@/types/organization.types'

export const organizationsApi = {
  get: () => apiClient.get<{ data: Organization }>('/organization').then(unwrap<Organization>),

  update: (data: Partial<Organization>) =>
    apiClient.put<{ data: Organization }>('/organization', data).then(unwrap<Organization>),

  currencies: () => apiClient.get<{ data: Currency[] }>('/currencies').then(unwrap<Currency[]>),

  uploadLogo: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient
      .post<{ data: Organization }>('/organization/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(unwrap<Organization>)
  },
}
