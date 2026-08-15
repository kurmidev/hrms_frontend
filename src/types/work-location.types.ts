export interface WorkLocation {
  id: string
  organizationId: string
  name: string
  lat: number
  lng: number
  radiusMeters: number
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface CreateWorkLocationDto {
  name: string
  lat: number
  lng: number
  radiusMeters: number
  isActive?: boolean
}

export type UpdateWorkLocationDto = Partial<CreateWorkLocationDto>

export interface WorkLocationDeleteResponse {
  deleted: boolean
  message: string
}
