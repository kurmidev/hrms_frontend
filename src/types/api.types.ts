export interface ApiResponse<T> {
  success: boolean
  data: T
  timestamp: string
}

export interface PaginatedMeta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export interface PaginatedData<T> {
  data: T[]
  meta: PaginatedMeta
}

export type PaginatedResponse<T> = ApiResponse<PaginatedData<T>>

export interface ApiError {
  statusCode: number
  timestamp: string
  path: string
  method: string
  error: string
}

export interface PaginationParams {
  page?: number
  limit?: number
  search?: string
}
