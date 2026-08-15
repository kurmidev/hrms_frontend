export interface OdLocationEntry {
  id: string
  odRecordId: string
  lat: number
  lng: number
  locationName: string | null
  minutes: number
  recordedAt: string
}

export interface OdRecord {
  id: string
  organizationId: string
  employeeId: string
  date: string
  reason: string | null
  totalMinutes: number
  entries: OdLocationEntry[]
  createdAt: string
  updatedAt: string
}

export interface CreateOdDto {
  lat: number
  lng: number
  minutes: number
  reason?: string
}

export interface AddOdLocationDto {
  lat: number
  lng: number
  minutes: number
}
