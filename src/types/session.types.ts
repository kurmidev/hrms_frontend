export interface Session {
  sessionId: string
  deviceInfo?: string | null
  ip?: string | null
  createdAt: string
  lastActiveAt: string
  isCurrent: boolean
}
