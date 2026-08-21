export type OnboardingStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'ACTIVATED'
  | 'REJECTED'
  | 'EXPIRED'

export interface OnboardingLink {
  id: string
  organizationId: string
  token: string
  email: string
  phone: string
  candidateName: string
  expiresAt: string
  usedAt: string | null
  submissionData: Record<string, unknown> | null
  status: OnboardingStatus
  hrNotes: string | null
  reviewedById: string | null
  reviewedAt: string | null
  activatedById: string | null
  activatedAt: string | null
  employeeId: string | null
  jobTitle: string | null
  departmentName: string | null
  workLocation: string | null
  prefillJoiningDate: string | null
  prefillEmploymentType: string | null
  transitions?: OnboardingTransition[]
  employee?: { id: string; firstName: string; lastName: string; empCode: string } | null
  createdAt: string
  updatedAt: string
}

export interface OnboardingTransition {
  id: string
  onboardingLinkId: string
  fromStatus: OnboardingStatus
  toStatus: OnboardingStatus
  actorId: string | null
  actorType: string
  notes: string | null
  occurredAt: string
}

export interface CreateOnboardingLinkDto {
  email: string
  phone: string
  candidateName: string
  jobTitle: string
  departmentName: string
  workLocation?: string
  prefillJoiningDate?: string
  prefillEmploymentType?: string
}

export interface ApproveOnboardingDto {
  departmentId: string
  designationId: string
  roleIds: string[]
  payrollStructureId: string
  leavePolicyIds: string[]
  employmentType: string
  joiningDate: string
  reportingManagerId?: string
  empCode?: string
  probationEndDate?: string
}
