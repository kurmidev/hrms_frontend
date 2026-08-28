import { apiClient, unwrap } from './client'
import type { SmsTemplate, UpdateSmsTemplateInput } from '@/types/sms-template.types'

export const smsTemplatesApi = {
  list: () =>
    apiClient.get<{ data: SmsTemplate[] }>('/sms-templates').then(unwrap<SmsTemplate[]>),

  get: (id: string) =>
    apiClient.get<{ data: SmsTemplate }>(`/sms-templates/${id}`).then(unwrap<SmsTemplate>),

  update: (id: string, data: UpdateSmsTemplateInput) =>
    apiClient.put<{ data: SmsTemplate }>(`/sms-templates/${id}`, data).then(unwrap<SmsTemplate>),
}
