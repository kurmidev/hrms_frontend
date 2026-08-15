export type ChatRoomType = 'DIRECT' | 'GROUP' | 'DEPARTMENT'

export type ChatMessageType = 'TEXT' | 'FILE' | 'SYSTEM'

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string
  senderName: string
  content: string | null
  messageType: string
  fileUrl: string | null
  fileName: string | null
  sentAt: string
  editedAt: string | null
  deletedAt: string | null
}

export interface ChatRoomMember {
  employeeId: string
  name: string
  role: string
  joinedAt: string
  revokedAt: string | null
}

export interface ChatRoom {
  id: string
  type: ChatRoomType
  name: string | null
  departmentId: string | null
  isActive: boolean
  createdAt: string
  members: ChatRoomMember[]
  lastMessage: ChatMessage | null
}

export interface CreateRoomDto {
  type: ChatRoomType
  name?: string
  departmentId?: string
  memberEmployeeIds?: string[]
}

export interface SendMessageDto {
  content: string
}
