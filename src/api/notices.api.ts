import { apiClient, unwrap } from './client'
import type { Notice, NoticeReadReceipt, CreateNoticeInput, UpdateNoticeInput } from '@/types/notices.types'
import type { PaginationParams } from '@/types/api.types'

interface NoticeListParams extends PaginationParams {
  view?: 'board' | 'manage'
  status?: string
}

export const noticesApi = {
  listBoard: (params?: PaginationParams & { status?: string }) =>
    apiClient.get('/notices', { params: { ...params, view: 'board' } }).then(unwrap),

  listManage: (params?: PaginationParams & { status?: string }) =>
    apiClient.get('/notices', { params: { ...params, view: 'manage' } }).then(unwrap),

  list: (params?: NoticeListParams) =>
    apiClient.get('/notices', { params }).then(unwrap),

  get: (id: string) =>
    apiClient.get<{ data: Notice }>(`/notices/${id}`).then(unwrap<Notice>),

  create: (data: CreateNoticeInput) =>
    apiClient.post<{ data: Notice }>('/notices', data).then(unwrap<Notice>),

  update: (id: string, data: UpdateNoticeInput) =>
    apiClient.put<{ data: Notice }>(`/notices/${id}`, data).then(unwrap<Notice>),

  publish: (id: string) =>
    apiClient.put<{ data: Notice }>(`/notices/${id}/publish`).then(unwrap<Notice>),

  remove: (id: string) =>
    apiClient.delete(`/notices/${id}`).then(unwrap),

  uploadAttachment: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient
      .post<{ data: Notice }>(`/notices/${id}/attachment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(unwrap<Notice>)
  },

  markRead: (id: string) =>
    apiClient.put(`/notices/${id}/read`).then(unwrap),

  getReadReceipts: (id: string, params?: PaginationParams) =>
    apiClient.get<{ data: NoticeReadReceipt[] }>(`/notices/${id}/read-receipts`, { params }).then(unwrap),
}
