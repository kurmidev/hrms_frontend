export interface Zone {
  id: string
  organizationId: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface CreateZoneDto {
  name: string
  isActive?: boolean
}

export type UpdateZoneDto = Partial<CreateZoneDto>
