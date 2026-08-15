export type PayrollRunStatus = 'DRAFT' | 'PROCESSING' | 'COMPLETED' | 'APPROVED' | 'DISBURSED'

export interface PayrollRun {
  id: string
  organizationId: string
  month: number
  year: number
  status: PayrollRunStatus
  initiatedBy: string | null
  processedAt: string | null
  approvedAt: string | null
  disbursedAt: string | null
  entryCount: number
  totalGross: number
  totalNet: number
  totalDeductions: number
  createdAt: string
  updatedAt: string
}

export interface PayrollEntryEmployeeRef {
  id: string
  empCode: string
  firstName: string
  lastName: string
  departmentName?: string | null
}

export interface PayrollEntry {
  id: string
  payrollRunId: string
  employeeId: string
  employee: PayrollEntryEmployeeRef
  workingDays: number
  presentDays: number
  lopDays: number
  basicSalary: number
  hra: number
  specialAllowance: number
  educationAllowance: number
  otherAllowances: number
  incentiveAmount: number
  cumulativeIncentive: number
  overtimeAmount: number
  travelAllowance: number
  bonus: number
  greenThanksAmount: number
  grossSalary: number
  pfEmployee: number
  esiEmployee: number
  professionalTax: number
  tds: number
  loanDeduction: number
  advanceDeduction: number
  otherDeductions: number
  netSalary: number
  remarks: string | null
  status: string
}

export interface InitiatePayrollRunDto {
  month: number
  year: number
  employeeIds?: string[]
}

export interface UpdatePayrollEntryDto {
  remarks?: string
  tds?: number
  otherDeductions?: number
}
