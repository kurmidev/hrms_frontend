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
  PRE_BOARDING: 'bg-blue-100 text-blue-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  ON_LEAVE: 'bg-amber-100 text-amber-700',
  SUSPENDED: 'bg-orange-100 text-orange-700',
  EXITED: 'bg-slate-100 text-slate-600',
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
  PENDING: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  SUBMITTED: 'bg-violet-100 text-violet-700',
  UNDER_REVIEW: 'bg-amber-100 text-amber-700',
  CHANGES_REQUESTED: 'bg-orange-100 text-orange-700',
  ACTIVATED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  EXPIRED: 'bg-slate-100 text-slate-500',
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
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-slate-100 text-slate-600',
}

export const ATTENDANCE_STATUS_LABELS: Record<string, string> = {
  PRESENT: 'Present',
  ABSENT: 'Absent',
  HALF_DAY: 'Half Day',
  LOSS_OF_PAY: 'Loss of Pay',
  ON_LEAVE: 'On Leave',
  HOLIDAY: 'Holiday',
  WEEK_OFF: 'Week Off',
}

export const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  PRESENT: 'bg-emerald-100 text-emerald-700',
  ABSENT: 'bg-red-100 text-red-700',
  HALF_DAY: 'bg-amber-100 text-amber-700',
  LOSS_OF_PAY: 'bg-orange-100 text-orange-700',
  ON_LEAVE: 'bg-blue-100 text-blue-700',
  HOLIDAY: 'bg-violet-100 text-violet-700',
  WEEK_OFF: 'bg-slate-100 text-slate-600',
}

export const PAYROLL_RUN_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PROCESSING: 'Processing',
  COMPLETED: 'Completed',
  APPROVED: 'Approved',
  DISBURSED: 'Disbursed',
}

export const PAYROLL_RUN_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600',
  PROCESSING: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-violet-100 text-violet-700',
  DISBURSED: 'bg-emerald-100 text-emerald-700',
}

export const LOAN_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
}

export const LOAN_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  REJECTED: 'bg-red-100 text-red-700',
  ACTIVE: 'bg-emerald-100 text-emerald-700',
  CLOSED: 'bg-slate-100 text-slate-600',
}

export const TODO_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pending',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
}

export const TODO_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-slate-100 text-slate-600',
  SUBMITTED: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
}

export const PERMISSION_GROUPS: Record<string, string[]> = {
  'Organization': ['org:read', 'org:update'],
  'Employees': ['employee:read', 'employee:create', 'employee:update', 'employee:delete'],
  'Payroll': ['payroll:read', 'payroll:create', 'payroll:update', 'payroll:delete'],
  'Roles': ['role:read', 'role:create', 'role:update', 'role:delete', 'role:assign'],
  'Reports': ['report:read'],
  'Dashboard': ['dashboard:read'],
}

export const ALL_PERMISSIONS = Object.values(PERMISSION_GROUPS).flat()

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
export const DEFAULT_PAGE_SIZE = 20
