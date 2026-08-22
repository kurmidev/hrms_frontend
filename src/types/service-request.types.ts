export type ServiceRequestCategory =
  | 'HR'
  | 'IT'
  | 'ADMIN'
  | 'COMPLIANCE'
  | 'FINANCE'
  | 'POLICY_CLARIFICATION'
  | 'SPECIAL_LEAVE'

export type ServiceRequestStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

export type ServiceRequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface ServiceRequestEmployeeRef {
  id: string
  empCode: string
  firstName: string
  lastName: string
}

export interface ServiceRequestComment {
  id: string
  serviceRequestId: string
  authorId: string | null
  content: string
  createdAt: string
}

export interface ServiceRequestLeavePolicyTypeRef {
  id: string
  name: string
  leaveType: string
}

export interface ServiceRequest {
  id: string
  organizationId: string
  employeeId: string | null
  employee: ServiceRequestEmployeeRef | null
  category: ServiceRequestCategory
  title: string
  description: string
  priority: ServiceRequestPriority
  status: ServiceRequestStatus
  assignedTo: string | null
  slaDeadline: string | null
  isAnonymous: boolean
  resolvedAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
  comments?: ServiceRequestComment[]
  // SPECIAL_LEAVE category fields — present only when category === 'SPECIAL_LEAVE'.
  leavePolicyTypeId?: string | null
  leaveFromDate?: string | null
  leaveToDate?: string | null
  leaveDays?: number | null
  leavePolicyType?: ServiceRequestLeavePolicyTypeRef | null
}

export interface CreateServiceRequestDto {
  category: ServiceRequestCategory
  title: string
  description: string
  priority?: ServiceRequestPriority
  isAnonymous?: boolean
  // Required when category === 'SPECIAL_LEAVE'.
  employeeId?: string
  leavePolicyTypeId?: string
  leaveFromDate?: string
  leaveToDate?: string
  leaveDays?: number
}

export interface GrantSpecialLeaveResponse {
  serviceRequest: ServiceRequest
  leaveApplication: {
    id: string
    status: string
    fromDate: string
    toDate: string
    days: number
  }
}

export interface AssignServiceRequestDto {
  assignedTo: string
  slaDeadline?: string
}

export interface ResolveServiceRequestDto {
  resolutionNote?: string
}

export interface UpdateServiceRequestStatusDto {
  status: ServiceRequestStatus
}

export interface CreateServiceRequestCommentDto {
  content: string
}
