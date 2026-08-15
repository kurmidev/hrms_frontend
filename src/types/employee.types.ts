export interface EmployeeStats {
  total: number
  byStatus: Record<string, number>
  byType: Record<string, number>
  byDepartment: { id: string; name: string; count: number }[]
}

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERN'
export type EmployeeStatus = 'PRE_BOARDING' | 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'EXITED'
export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

export interface BankDetails {
  accountHolderName: string
  accountNumber: string
  ifscCode: string
  bankName: string
  branchName?: string
  accountType?: string
}

export interface EmergencyContact {
  name: string
  phone: string
  relationship: string
  address?: string
}

export interface EmployeeDocument {
  documentType: string
  fileUrl: string
  notes?: string
  uploadedAt: string
}

export interface Employee {
  id: string
  organizationId: string
  empCode: string
  firstName: string
  lastName: string
  email: string
  phone: string
  dateOfBirth: string | null
  gender: Gender | null
  nationality: string | null
  profilePhotoUrl: string | null
  workLocation: string | null
  bloodGroup: string | null
  departmentId: string | null
  designationId: string | null
  reportingManagerId: string | null
  payrollStructureId: string | null
  leavePolicyId: string | null
  employmentType: EmploymentType
  status: EmployeeStatus
  joiningDate: string
  probationEndDate: string | null
  pfNumber: string | null
  esiNumber: string | null
  uanNumber: string | null
  bankDetails: BankDetails | null
  emergencyContact: EmergencyContact | null
  documents: EmployeeDocument[]
  address: Record<string, string> | null
  department?: { id: string; name: string }
  designation?: { id: string; name: string }
  reportingManager?: { id: string; firstName: string; lastName: string; profilePhotoUrl: string | null }
  payrollStructure?: { id: string; name: string }
  leavePolicy?: { id: string; name: string }
  user?: { id: string; email: string; isActive: boolean; mustChangePassword: boolean }
  createdAt: string
  updatedAt: string
}

export interface CreateEmployeeDto {
  firstName: string
  lastName: string
  email: string
  phone: string
  departmentId: string
  designationId: string
  payrollStructureId: string
  leavePolicyId: string
  employmentType: EmploymentType
  joiningDate: string
  reportingManagerId?: string
  empCode?: string
  probationEndDate?: string
  dateOfBirth?: string
  gender?: Gender
  pfNumber?: string
  esiNumber?: string
  uanNumber?: string
}
