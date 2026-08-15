import type { PaginatedMeta } from './api.types'

export type ReportType = 'headcount' | 'attendance' | 'leave' | 'payroll' | 'loans' | 'incentives'

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
  lopDays: number
}

export interface AttendanceReport {
  from: string
  to: string
  totalPresent: number
  totalAbsent: number
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

export interface PayrollReport {
  runId: string | null
  month: number
  year: number
  status: string | null
  employeeCount: number
  totalGross: number
  totalDisbursed: number
  componentBreakdown: PayrollComponentBreakdown
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
