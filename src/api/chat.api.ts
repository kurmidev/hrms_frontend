import { apiClient, unwrap } from './client'
import type { ChatRoom, ChatMessage, CreateRoomDto, SendMessageDto } from '@/types/chat.types'
import type { PaginationParams } from '@/types/api.types'

export const chatApi = {
  createRoom: (data: CreateRoomDto) =>
    apiClient.post<{ data: ChatRoom }>('/chat/rooms', data).then(unwrap<ChatRoom>),

  listRooms: () =>
    apiClient.get<{ data: ChatRoom[] }>('/chat/rooms').then(unwrap<ChatRoom[]>),

  getMessages: (roomId: string, params?: PaginationParams) =>
    apiClient.get(`/chat/rooms/${roomId}/messages`, { params }).then(unwrap),

  sendMessage: (roomId: string, data: SendMessageDto) =>
    apiClient.post<{ data: ChatMessage }>(`/chat/rooms/${roomId}/messages`, data).then(unwrap<ChatMessage>),

  uploadAttachment: (roomId: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient
      .post<{ data: ChatMessage }>(`/chat/rooms/${roomId}/attachment`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(unwrap<ChatMessage>)
  },
}
