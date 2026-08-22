export type GreenThanksDirection = 'sent' | 'received'

export type GreenThanksStatus = 'pending' | 'approved' | 'rejected'

export interface GreenThanksEmployeeRef {
  id: string
  empCode: string
  firstName: string
  lastName: string
}

export interface GreenThanks {
  id: string
  fromEmployeeId: string
  fromEmployee: GreenThanksEmployeeRef | null
  toEmployeeId: string
  toEmployee: GreenThanksEmployeeRef | null
  points: number
  reason: string
  status: GreenThanksStatus
  approvedBy: string | null
  awardedAt: string | null
  payrollMonth: number | null
  payrollYear: number | null
  isPaid: boolean
  createdAt: string
}

export interface GreenThanksEmployeeRef {
  id: string
  empCode: string
  firstName: string
  lastName: string
}

export interface CreateGreenThanksInput {
  toEmployeeId: string
  points: number
  reason: string
}

export interface ApproveGreenThanksInput {
  approve: boolean
  rejectionNote?: string
  payrollMonth?: number
  payrollYear?: number
}

export interface GreenThanksConfig {
  id: string
  organizationId: string
  inrPerPoint: number
  quarterlyLimitPoints: number
  isPayrollLinked: boolean
  effectiveFrom: string
  createdAt: string
}

export interface UpdateGreenThanksConfigInput {
  inrPerPoint?: number
  quarterlyLimitPoints?: number
  isPayrollLinked?: boolean
  effectiveFrom?: string
}
