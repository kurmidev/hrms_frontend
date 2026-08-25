import type { PaginatedMeta } from './api.types'

export type ReportType =
  | 'headcount'
  | 'attendance'
  | 'leave'
  | 'payroll'
  | 'loans'
  | 'incentives'
  | 'attendance-track'
  | 'performance'
  | 'todo-incentive'
  | 'audit'

export interface ReportFilters {
  from?: string
  to?: string
  departmentId?: string
  month?: number
  year?: number
  page?: number
  limit?: number
}

export interface HeadcountReport {
  total: number
  byDepartment: { departmentId: string; departmentName: string; count: number }[]
  byDesignation: { designationId: string; designationName: string; count: number }[]
  byEmploymentType: { employmentType: string; count: number }[]
  byStatus: { status: string; count: number }[]
}

export interface AttendanceReportRow {
  employeeId: string
  empCode: string
  name: string
  presentDays: number
  absentDays: number
  leaveDays: number
  lopDays: number
}

export interface AttendanceReport {
  from: string
  to: string
  totalPresent: number
  totalAbsent: number
  totalLeave: number
  totalLop: number
  byStatus: { status: string; count: number }[]
  rows: AttendanceReportRow[]
  meta: PaginatedMeta
}

export interface LeaveReportRow {
  employeeId: string
  empCode: string
  name: string
  leavePolicyId: string
  leaveType: string
  entitledDays: number
  takenDays: number
  balanceDays: number
}

export interface LeaveReport {
  year: number
  pendingApplications: number
  rows: LeaveReportRow[]
  meta: PaginatedMeta
}

export interface PayrollComponentBreakdown {
  basicSalary: number
  hra: number
  specialAllowance: number
  educationAllowance: number
  otherAllowances: number
  incentiveAmount: number
  overtimeAmount: number
  travelAllowance: number
  bonus: number
  greenThanksAmount: number
  pfEmployee: number
  pfEmployer: number
  esiEmployee: number
  esiEmployer: number
  professionalTax: number
  tds: number
  loanDeduction: number
  advanceDeduction: number
  otherDeductions: number
}

export interface PayrollEmployeeRow {
  employeeId: string
  empCode: string
  name: string
  basicSalary: number
  hra: number
  specialAllowance: number
  educationAllowance: number
  otherAllowances: number
  incentiveAmount: number
  overtimeAmount: number
  travelAllowance: number
  bonus: number
  greenThanksAmount: number
  grossSalary: number
  pfEmployee: number
  pfEmployer: number
  esiEmployee: number
  esiEmployer: number
  professionalTax: number
  tds: number
  loanDeduction: number
  advanceDeduction: number
  otherDeductions: number
  netSalary: number
}

export interface PayrollReport {
  runId: string | null
  month: number
  year: number
  status: string | null
  employeeCount: number
  totalGross: number
  totalDisbursed: number
  componentBreakdown: PayrollComponentBreakdown
  rows: PayrollEmployeeRow[]
  meta: PaginatedMeta
}

export interface LoanReportRow {
  loanId: string
  employeeId: string
  empCode: string
  name: string
  amountRequested: number
  amountApproved: number | null
  status: string
  outstandingBalance: number
}

export interface LoanReport {
  activeLoanCount: number
  totalOutstanding: number
  rows: LoanReportRow[]
  meta: PaginatedMeta
}

export interface IncentiveReportRow {
  employeeId: string
  empCode: string
  name: string
  payrollMonth: number
  payrollYear: number
  totalAmount: number
}

export interface IncentiveReport {
  month: number | null
  year: number | null
  totalAmount: number
  rows: IncentiveReportRow[]
  meta: PaginatedMeta
}

export interface AttendanceTrackReportRow {
  employeeId: string
  empCode: string
  name: string
  date: string
  checkInAt: string | null
  checkOutAt: string | null
  checkInLat: number | null
  checkInLng: number | null
  checkInLocationName: string | null
  checkOutLat: number | null
  checkOutLng: number | null
  checkOutLocationName: string | null
  source: string
  status: string
  totalHours: number | null
}

export interface AttendanceTrackLiveRow {
  employeeId: string
  empCode: string
  name: string
  lat: number
  lng: number
  recordedAt: string
}

export interface AttendanceTrackReport {
  from: string
  to: string
  rows: AttendanceTrackReportRow[]
  meta: PaginatedMeta
  liveNow: AttendanceTrackLiveRow[]
}

export interface PerformanceReportRow {
  employeeId: string
  empCode: string
  name: string
  cycleId: string
  cycleName: string
  rating: number
  isEligibleForIncrement: boolean
  ratedBy: string
  submittedAt: string
  kpiAssignedCount: number
  kpiAchievedCount: number
  kpiAchievementRate: number
}

export interface PerformanceReport {
  from: string
  to: string
  avgRating: number
  totalRatingsCount: number
  rows: PerformanceReportRow[]
  meta: PaginatedMeta
}

export interface TodoIncentiveReportRow {
  employeeId: string
  empCode: string
  name: string
  todosTotal: number
  todosApproved: number
  todosRejected: number
  completionRate: number
  incentiveTotalAmount: number
  incentiveReleasedAmount: number
}

export interface TodoIncentiveReport {
  orgTodosApproved: number
  orgIncentiveTotalAmount: number
  rows: TodoIncentiveReportRow[]
  meta: PaginatedMeta
}

export interface AuditHistoryReportRow {
  userId: string
  email: string
  empCode: string | null
  name: string
  ipAddress: string | null
  userAgent: string | null
  deviceInfo: string | null
  loginAt: string
  logoutAt: string | null
  status: string
}

export interface AuditSystemChangeRow {
  action: string
  entityType: string
  entityId: string | null
  actorId: string | null
  occurredAt: string
  ipAddress: string | null
}

export interface AuditHistoryReport {
  from: string
  to: string
  totalLogins: number
  failedLogins: number
  uniqueUsers: number
  rows: AuditHistoryReportRow[]
  meta: PaginatedMeta
  systemChanges: AuditSystemChangeRow[]
}

export interface DashboardKpis {
  kpi_total_employees: number
  kpi_active_employees: number
  kpi_on_leave: number
  kpi_attendance_rate: number | null
  kpi_pending_approvals: number
  kpi_pending_approvals_breakdown: {
    leave: number
    loan: number
    serviceRequest: number
    todo: number
  }
  kpi_payroll_total: number | null
  kpi_open_loans: number
  kpi_open_assets: number
  kpi_open_tickets: number
  kpi_my_leave_balance: number | null
  kpi_my_performance: number | null
}
