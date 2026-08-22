export interface GlobalLeaveZoneRef {
  id: string
  name: string
}

export interface GlobalLeave {
  id: string
  name: string
  date: string
  appliesToAll: boolean
  zones: GlobalLeaveZoneRef[]
  createdAt: string
}

export interface CreateGlobalLeaveDto {
  name: string
  date: string
  appliesToAll?: boolean
  zoneIds?: string[]
}

export interface BulkCreateGlobalLeaveDto {
  items: CreateGlobalLeaveDto[]
}

export interface BulkGlobalLeaveError {
  index: number
  name: string
  error: string
}

export interface BulkGlobalLeaveResult {
  createdCount: number
  errorCount: number
  errors: BulkGlobalLeaveError[]
}
