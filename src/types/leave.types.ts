export type LeaveType =
  | 'CASUAL'
  | 'SICK'
  | 'EARNED'
  | 'LOSS_OF_PAY'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'COMPENSATORY'

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

export interface LeavePolicy {
  id: string
  name: string
  leaveType: LeaveType
  daysPerYear: number
  carryForwardMax: number
  accrualType: string
  isActive: boolean
  minAdvanceDays: number
  maxConsecutiveDays?: number | null
  allowedInProbation: boolean
}

export interface LeaveBalance {
  id: string
  employeeId: string
  leavePolicyId: string
  year: number
  entitledDays: number
  takenDays: number
  carriedForwardDays: number
  balanceDays: number
  leavePolicy?: LeavePolicy
}

export interface LeaveEmployeeRef {
  id: string
  firstName: string
  lastName: string
  empCode: string
}

export interface LeaveApplication {
  id: string
  employeeId: string
  leavePolicyId: string
  fromDate: string
  toDate: string
  days: number
  reason?: string | null
  status: LeaveStatus
  approverId?: string | null
  rejectionNote?: string | null
  appliedAt: string
  decidedAt?: string | null
  employee?: LeaveEmployeeRef
  leavePolicy?: LeavePolicy
}

export type HolidayType = 'NATIONAL' | 'OPTIONAL'

export interface Holiday {
  id: string
  organizationId?: string
  name: string
  date: string
  type: HolidayType
}

export interface CreateHolidayDto {
  name: string
  date: string
  type: HolidayType
}

export type UpdateHolidayDto = Partial<CreateHolidayDto>

export interface ApplyLeaveDto {
  leavePolicyId: string
  fromDate: string
  toDate: string
  days: number
  reason?: string
}

export interface DecideLeaveDto {
  notes?: string
}

export interface RejectLeaveDto {
  rejectionNote?: string
}
