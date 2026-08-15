export type InsuranceType = 'HEALTH' | 'ACCIDENTAL'
export type InsuranceEnrollmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface InsurancePolicy {
  id: string
  organizationId: string
  name: string
  provider: string
  policyNumber: string
  type: InsuranceType
  coverageAmount: number
  premium: number
  validFrom: string | null
  validTo: string | null
  renewalDate: string | null
  documentUrl: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface FamilyMember {
  name: string
  relation: string
  dateOfBirth: string
}

export interface EmployeeInsuranceEmployee {
  id: string
  empCode: string
  firstName: string
  lastName: string
  pfNumber: string | null
  esiNumber: string | null
  uanNumber: string | null
}

export interface EmployeeInsurance {
  id: string
  employeeId: string
  employee: EmployeeInsuranceEmployee
  policyId: string
  policy: InsurancePolicy
  enrolledAt: string
  status: string
  approvalStatus: InsuranceEnrollmentStatus
  approvedBy: string | null
  approvedAt: string | null
  familyMembers: FamilyMember[] | null
  updatedAt: string
}

export interface CreateInsurancePolicyDto {
  name: string
  provider: string
  policyNumber: string
  type: InsuranceType
  coverageAmount: number
  premium: number
  validFrom?: string
  validTo?: string
  renewalDate?: string
  documentUrl?: string
  isActive?: boolean
}

export interface EnrollInsuranceDto {
  employeeId: string
  policyId: string
  familyMembers?: FamilyMember[]
}

export interface UpdateEnrollmentDto {
  familyMembers?: FamilyMember[]
}

export interface ApproveEnrollmentDto {
  approvalStatus: 'APPROVED' | 'REJECTED'
}
