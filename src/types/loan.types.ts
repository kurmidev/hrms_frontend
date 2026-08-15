export type LoanStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'CLOSED'

export interface LoanEmployeeRef {
  id: string
  empCode: string
  firstName: string
  lastName: string
  departmentName?: string | null
}

export interface Loan {
  id: string
  employeeId: string
  employee: LoanEmployeeRef
  amountRequested: number
  amountApproved: number | null
  interestRate: number | null
  tenureMonths: number | null
  status: LoanStatus
  reason: string | null
  approvedBy: string | null
  disbursedAt: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
  emiSchedule?: LoanEmiSchedule[]
}

export interface LoanEmiSchedule {
  id: string
  loanId: string
  installmentNo: number
  emiMonth: number
  emiYear: number
  emiAmount: number
  principal: number
  interest: number
  outstandingBalance: number
  isDeducted: boolean
  payrollEntryId: string | null
  dueDate: string
  paidAt: string | null
}

export interface CreateLoanDto {
  amountRequested: number
  tenureMonths: number
  reason?: string
  employeeId?: string
}

export interface ApproveLoanDto {
  interestRate: number
  amountApproved?: number
  tenureMonths?: number
}

export interface RejectLoanDto {
  reason?: string
}
