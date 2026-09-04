export type LeaveType = 'CASUAL' | 'SICK' | 'EARNED' | 'LOSS_OF_PAY' | 'MATERNITY' | 'PATERNITY' | 'COMPENSATORY'
export type PayrollCalculationType = 'PERCENTAGE' | 'FIXED' | 'SLAB_BASED'
export type PayrollApplicableOn = 'GROSS' | 'BASIC' | 'NET' | 'CUSTOM'

export interface Organization {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  currency: string
  isActive: boolean
  allowAnonymousServiceRequests: boolean
  autoLogoutEnabled: boolean
  autoLogoutTime: string | null
  autoLogoutTimezone: string
  createdAt: string
  updatedAt: string
}

export interface Department {
  id: string
  organizationId: string
  name: string
  parentId: string | null
  headEmployeeId: string | null
  hierarchyLevel: number
  childCount?: number
  employeeCount?: number
  parent?: { id: string; name: string }
  head?: { id: string; firstName: string; lastName: string }
  createdAt: string
  updatedAt: string
}

export interface DepartmentTreeNode extends Department {
  children: DepartmentTreeNode[]
}

export interface Designation {
  id: string
  organizationId: string
  departmentId: string
  name: string
  level: number
  payrollStructureId: string | null
  employeeCount?: number
  department?: { id: string; name: string }
  payrollStructure?: { id: string; name: string }
  createdAt: string
  updatedAt: string
}

export interface Role {
  id: string
  organizationId: string
  name: string
  description: string | null
  permissions: string[]
  isSystemRole: boolean
  userCount?: number
  createdAt: string
  updatedAt: string
}

// Matches `SalaryComponentDto` (backend/src/modules/organizations/payroll-structures/dto/salary-component.dto.ts)
// exactly. Previous shape here (`type: 'earning'|'deduction'`, `amount`/`percentage`)
// never matched the real API response (`type: 'FIXED'|'VARIABLE'|'PERCENTAGE'`, `value`,
// `isDeductible`), so every component amount on the Payroll Structures page silently
// rendered as "—" instead of the real value.
export interface SalaryComponent {
  name: string
  type: 'FIXED' | 'VARIABLE' | 'PERCENTAGE'
  value: number
  baseOn?: 'CTC' | 'BASIC' | 'GROSS'
  isDeductible: boolean
  isStatutory?: boolean
  description?: string
}

export interface PayrollStructure {
  id: string
  organizationId: string
  name: string
  components: SalaryComponent[]
  isActive: boolean
  employeeCount?: number
  designations?: Designation[]
  createdAt: string
  updatedAt: string
}

export interface LeavePolicyType {
  id?: string
  leavePolicyId?: string
  leaveType: LeaveType
  name?: string | null
  daysPerYear: number
  carryForwardMax?: number
  accrualType?: string
  isEncashable?: boolean
  isLopEligible?: boolean
  minAdvanceDays?: number
  maxConsecutiveDays?: number | null
  allowedInProbation?: boolean
  genderRestriction?: string | null
  createdAt?: string
  updatedAt?: string
}

// A LeavePolicy is a named bundle of one or more LeavePolicyType rows (e.g.
// "Standard Policy" = CL 12d + SL 10d + PL 15d). Matches
// LeavePolicyResponseDto (backend/.../leave-policies/dto/leave-policy-response.dto.ts).
export interface LeavePolicy {
  id: string
  organizationId: string
  name: string
  isActive: boolean
  employeeCount?: number
  types: LeavePolicyType[]
  rules?: LeavePolicyRule[]
  createdAt: string
  updatedAt: string
  deletedAt?: string | null
}

export interface LeavePolicyRule {
  id: string
  organizationId: string
  leavePolicyId: string
  name: string
  ruleType: string
  conditionLogic: string
  conditions: Record<string, unknown>
  action: Record<string, unknown>
  priority: number
  isActive: boolean
}

export interface TaxSlab {
  fromAmount: number
  toAmount?: number
  rate?: number
  fixedAmount?: number
}

export interface TaxRuleApplicabilityRules {
  employmentTypes?: string[]
  designationLevelMin?: number
  designationLevelMax?: number
  salaryCeiling?: number
}

export interface TaxRule {
  id: string
  organizationId: string
  name: string
  code: string | null
  type: string
  calculationType: PayrollCalculationType
  applicableOn: PayrollApplicableOn
  isStatutory: boolean
  config: Record<string, unknown>
  applicabilityRules: TaxRuleApplicabilityRules | null
  effectiveFrom: string
  effectiveTo: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTaxRuleDto {
  name: string
  code?: string
  type: string
  calculationType: PayrollCalculationType
  applicableOn: PayrollApplicableOn
  isStatutory?: boolean
  config: Record<string, unknown>
  applicabilityRules?: TaxRuleApplicabilityRules
  effectiveFrom: string
  effectiveTo?: string
  isActive?: boolean
}

export interface Currency {
  code: string
  name: string
  symbol: string
}
