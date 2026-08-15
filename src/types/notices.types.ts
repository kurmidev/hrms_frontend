export type NoticeStatus = 'draft' | 'scheduled' | 'published'

export type NoticeTargetType = 'ALL' | 'TARGETED'

export interface Notice {
  id: string
  title: string
  body: string
  status: NoticeStatus
  targetType: NoticeTargetType
  targetRoles: string[] | null
  targetDepts: string[] | null
  scheduledAt: string | null
  publishedAt: string | null
  expiresAt: string | null
  attachmentUrl: string | null
  attachmentName: string | null
  // Present on board rows only
  hasRead?: boolean
  // Present on manage rows only
  readCount?: number
  createdAt: string
}

export interface NoticeReadReceiptEmployeeRef {
  id: string
  empCode: string
  firstName: string
  lastName: string
}

export interface NoticeReadReceipt {
  employeeId: string
  employee: NoticeReadReceiptEmployeeRef
  readAt: string
}

export interface CreateNoticeInput {
  title: string
  body: string
  targetType: NoticeTargetType
  targetRoles?: string[]
  targetDepts?: string[]
  scheduledAt?: string
  expiresAt?: string
  publishNow?: boolean
}

export type UpdateNoticeInput = Partial<CreateNoticeInput>
