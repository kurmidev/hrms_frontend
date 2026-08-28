export interface SmsTemplate {
  id: string
  key: string
  name: string
  message: string
  tid: string | null
  senderId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface UpdateSmsTemplateInput {
  message: string
  tid?: string | null
  senderId?: string | null
  isActive?: boolean
}
