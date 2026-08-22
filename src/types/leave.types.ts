export type LeaveType =
  | 'CASUAL'
  | 'SICK'
  | 'EARNED'
  | 'LOSS_OF_PAY'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'COMPENSATORY'

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'

// A single leave type row within an employee's assigned LeavePolicy bundle
// (e.g. CL, SL, PL). Applications and balances now reference this, not the
// bundle itself — see leavePolicyTypeId below.
export interface LeavePolicyTypeRef {
  id: string
  name?: string | null
  leaveType: LeaveType
}

export interface LeaveBalance {
  id: string
  employeeId: string
  leavePolicyTypeId: string
  year: number
  entitledDays: number
  takenDays: number
  carriedForwardDays: number
  balanceDays: number
  leavePolicyType?: LeavePolicyTypeRef
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
  leavePolicyTypeId: string
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
  leavePolicyType?: LeavePolicyTypeRef
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
  leavePolicyTypeId: string
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
