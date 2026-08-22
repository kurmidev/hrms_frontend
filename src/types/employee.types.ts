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

// Matches backend UpdateBankDetailsDto (update-bank-details.dto.ts) exactly.
// Note: no accountHolderName field — that's not editable via this endpoint.
export type BankAccountType = 'SAVINGS' | 'CURRENT'
export interface UpdateBankDetailsDto {
  bankName: string
  accountNumber: string
  ifscCode: string
  accountType: BankAccountType
  branchName?: string
  micrCode?: string
}

// Matches backend UpdateEmergencyContactDto exactly — note `relation`, not
// `relationship` (the display-only EmergencyContact type above uses the
// latter; don't conflate the two).
export interface UpdateEmergencyContactDto {
  name: string
  phone: string
  relation: string
  alternatePhone?: string
  address?: string
}

export interface EmployeeDocument {
  documentType: string
  fileUrl: string
  notes?: string
  uploadedAt: string
}

export interface EmployeeAddress {
  line1?: string
  line2?: string
  city?: string
  state?: string
  pincode?: string
}

export interface PreviousEmployment {
  lastEmployerName?: string
  jobTitleAtLastEmployer?: string
  employmentFrom?: string
  employmentTo?: string
  lastManagerName?: string
  lastManagerContact?: string
  hrContactAtPreviousEmployer?: string
  reasonForLeaving?: string
}

export interface ReferenceContact {
  name: string
  contact: string
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
  address: EmployeeAddress | null
  healthInfo: Record<string, unknown> | null
  previousEmployment: PreviousEmployment[] | null
  referenceContacts: ReferenceContact[] | null
  zoneId: string | null
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

// Admin-only full update (PUT /employees/:id, requires employee:update).
// Includes the 5 admin-only fields (department/designation/leavePolicy/
// employmentType/zone+workLocation) plus profile fields UpdateEmployeeDto
// now accepts on the backend.
export interface UpdateEmployeeAdminDto extends Partial<CreateEmployeeDto> {
  zoneId?: string
  workLocation?: string
  nationality?: string
  bloodGroup?: string
  address?: EmployeeAddress
  healthInfo?: Record<string, unknown>
  previousEmployment?: PreviousEmployment[]
  referenceContacts?: ReferenceContact[]
  profilePhotoUrl?: string
}

// Self-service update (PATCH /employees/:id/self, requires profile:update,
// backend-enforced to the caller's own employee id). Structurally omits the
// 5 admin-only fields — never send them here even if present in state.
export interface UpdateEmployeeSelfDto {
  dateOfBirth?: string
  gender?: Gender
  nationality?: string
  bloodGroup?: string
  phone?: string
  email?: string
  address?: EmployeeAddress
  healthInfo?: Record<string, unknown>
  previousEmployment?: PreviousEmployment[]
  referenceContacts?: ReferenceContact[]
  profilePhotoUrl?: string
}
