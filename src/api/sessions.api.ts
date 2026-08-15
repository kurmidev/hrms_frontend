import { apiClient, unwrap } from './client'
import type { Session } from '@/types/session.types'

export const sessionsApi = {
  getSessions: () =>
    apiClient.get<{ data: Session[] }>('/auth/sessions').then(unwrap<Session[]>),

  revokeSession: (id: string) =>
    apiClient.delete(`/auth/sessions/${id}`).then(unwrap),

  revokeAllOther: () =>
    apiClient.delete('/auth/sessions').then(unwrap),
}
