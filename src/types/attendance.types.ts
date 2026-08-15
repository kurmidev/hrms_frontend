export type AttendanceStatus =
  | 'PRESENT'
  | 'ABSENT'
  | 'HALF_DAY'
  | 'LOSS_OF_PAY'
  | 'ON_LEAVE'
  | 'HOLIDAY'
  | 'WEEK_OFF'

export type AttendanceSource = 'MOBILE' | 'WEB' | 'MANUAL' | 'BIOMETRIC'

export interface AttendanceEmployeeRef {
  id: string
  firstName: string
  lastName: string
  empCode: string
}

export interface AttendanceLog {
  id: string
  employeeId: string
  date: string
  checkInAt?: string | null
  checkOutAt?: string | null
  checkInLat?: number | null
  checkInLng?: number | null
  checkInLocationName?: string | null
  checkOutLat?: number | null
  checkOutLng?: number | null
  checkOutLocationName?: string | null
  source: AttendanceSource
  status: AttendanceStatus
  totalHours?: number | null
  overtimeHours?: number | null
  approvedBy?: string | null
  notes?: string | null
  employee?: AttendanceEmployeeRef
}

export interface LiveLocation {
  id: string
  employeeId: string
  lat: number
  lng: number
  accuracy?: number | null
  locationName?: string | null
  recordedAt: string
  employee?: AttendanceEmployeeRef
}

export interface CheckInDto {
  lat: number
  lng: number
  accuracy?: number
  source: AttendanceSource
  timestamp?: string
}

export interface CheckOutDto {
  lat?: number
  lng?: number
  source?: AttendanceSource
  timestamp?: string
}

export interface ManualEntryDto {
  employeeId: string
  date: string
  checkInAt?: string
  checkOutAt?: string
  status?: AttendanceStatus
  notes?: string
}

export interface CorrectionRequestDto {
  date: string
  reason: string
  requestedCheckIn?: string
  requestedCheckOut?: string
}

export interface ApproveCorrectionDto {
  checkInAt?: string
  checkOutAt?: string
  status?: AttendanceStatus
  notes?: string
}
