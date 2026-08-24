import type { EmployeeStatus, EmploymentType } from '@/types/employee.types'
import type { OnboardingStatus } from '@/types/onboarding.types'

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: 'Full Time',
  PART_TIME: 'Part Time',
  CONTRACT: 'Contract',
  INTERN: 'Intern',
}

export const EMPLOYEE_STATUS_LABELS: Record<EmployeeStatus, string> = {
  PRE_BOARDING: 'Pre-Boarding',
  ACTIVE: 'Active',
  ON_LEAVE: 'On Leave',
  SUSPENDED: 'Suspended',
  EXITED: 'Exited',
}

export const EMPLOYEE_STATUS_COLORS: Record<EmployeeStatus, string> = {
  PRE_BOARDING: 'bg-primary/10 text-primary',
  ACTIVE: 'bg-accent-green/10 text-accent-green',
  ON_LEAVE: 'bg-accent-orange/10 text-accent-orange',
  SUSPENDED: 'bg-accent-red/10 text-accent-red',
  EXITED: 'bg-muted text-muted-foreground',
}

export const ONBOARDING_STATUS_LABELS: Record<OnboardingStatus, string> = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  CHANGES_REQUESTED: 'Changes Requested',
  ACTIVATED: 'Activated',
  REJECTED: 'Rejected',
  EXPIRED: 'Expired',
}

export const ONBOARDING_STATUS_COLORS: Record<OnboardingStatus, string> = {
  PENDING: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-accent-orange/10 text-accent-orange',
  SUBMITTED: 'bg-accent-orange/10 text-accent-orange',
  UNDER_REVIEW: 'bg-accent-orange/10 text-accent-orange',
  CHANGES_REQUESTED: 'bg-accent-orange/10 text-accent-orange',
  ACTIVATED: 'bg-accent-green/10 text-accent-green',
  REJECTED: 'bg-accent-red/10 text-accent-red',
  EXPIRED: 'bg-muted text-muted-foreground',
}

export const LEAVE_TYPE_LABELS: Record<string, string> = {
  CASUAL: 'Casual Leave',
  SICK: 'Sick Leave',
  EARNED: 'Earned Leave',
  LOSS_OF_PAY: 'Loss of Pay',
  MATERNITY: 'Maternity Leave',
  PATERNITY: 'Paternity Leave',
  COMPENSATORY: 'Compensatory Off',
}

export const LEAVE_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELLED: 'Cancelled',
}

export const LEAVE_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-accent-orange/10 text-accent-orange',
  APPROVED: 'bg-accent-green/10 text-accent-green',
  REJECTED: 'bg-accent-red/10 text-accent-red',
  CANCELLED: 'bg-muted text-muted-foreground',
}

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  HALF_DAY: 'Half Day',
  LOSS_OF_PAY: 'Loss of Pay',
  ON_LEAVE: 'On Leave',
  HOLIDAY: 'Holiday',
  WEEK_OFF: 'Week Off',
  ON_DUTY: 'On Duty',
}

export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-accent-green/10 text-accent-green',
  ABSENT: 'bg-accent-red/10 text-accent-red',
  HALF_DAY: 'bg-accent-orange/10 text-accent-orange',
  LOSS_OF_PAY: 'bg-accent-red/10 text-accent-red',
  ON_LEAVE: 'bg-accent-orange/10 text-accent-orange',
  HOLIDAY: 'bg-primary/10 text-primary',
  WEEK_OFF: 'bg-muted text-muted-foreground',
  ON_DUTY: 'bg-primary/10 text-primary',
}

export const PAYROLL_RUN_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  APPROVED: 'Approved',
  DISBURSED: 'Disbursed',
}

export const PAYROLL_RUN_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PROCESSING: 'bg-accent-orange/10 text-accent-orange',
  COMPLETED: 'bg-primary/10 text-primary',
  APPROVED: 'bg-primary/20 text-primary',
  DISBURSED: 'bg-accent-green/10 text-accent-green',
}

export const LOAN_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
}

export const LOAN_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-accent-orange/10 text-accent-orange',
  APPROVED: 'bg-primary/10 text-primary',
  REJECTED: 'bg-accent-red/10 text-accent-red',
  ACTIVE: 'bg-accent-green/10 text-accent-green',
  CLOSED: 'bg-muted text-muted-foreground',
}

export const TODO_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export const TODO_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-muted text-muted-foreground',
  SUBMITTED: 'bg-accent-orange/10 text-accent-orange',
  APPROVED: 'bg-accent-green/10 text-accent-green',
  REJECTED: 'bg-accent-red/10 text-accent-red',
}

export const SERVICE_REQUEST_CATEGORY_LABELS: Record<string, string> = {
  HR: 'HR',
  IT: 'IT',
  ADMIN: 'Admin',
  COMPLIANCE: 'Compliance',
  FINANCE: 'Finance',
  POLICY_CLARIFICATION: 'Policy Clarification',
  SPECIAL_LEAVE: 'Special Leave',
}

export const PERMISSION_GROUPS: Record<string, string[]> = {
  'Organization': ['org:read', 'org:update'],
  'Employees': ['employee:read', 'employee:create', 'employee:update', 'employee:delete'],
  'Payroll': ['payroll:read', 'payroll:create', 'payroll:update', 'payroll:delete', 'payroll:run', 'payroll:approve'],
  'Roles': ['role:read', 'role:create', 'role:update', 'role:delete', 'role:assign'],
  'Reports': ['report:read'],
  'Dashboard': ['dashboard:read'],
  'Performance': ['performance:read', 'performance:manage'],
  'Incentives': ['incentive:read', 'incentive:manage'],
  'Insurance': ['insurance:read', 'insurance:manage'],
  'Disciplinary': ['disciplinary:read', 'disciplinary:manage'],
  'Notices': ['notice:read', 'notice:manage'],
  'Green Thanks': ['green_thanks:read', 'green_thanks:create', 'green_thanks:manage'],
  'Assets': ['asset:read', 'asset:assign', 'asset:return'],
  'Service Requests': ['service_request:read', 'service_request:create', 'service_request:manage'],
  'Onboarding': ['onboarding:manage'],
  'Exit': ['exit:manage'],
  'Attendance': ['attendance:read', 'attendance:checkin', 'attendance:correct'],
  'Leave': ['leave:read', 'leave:apply', 'leave:approve'],
  'Loans': ['loan:read', 'loan:apply', 'loan:approve'],
  'Tasks': ['todo:read', 'todo:create', 'todo:approve'],
  'Users': ['user:read', 'user:manage'],
}

export const ALL_PERMISSIONS = Object.values(PERMISSION_GROUPS).flat()

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
export const DEFAULT_PAGE_SIZE = 20
