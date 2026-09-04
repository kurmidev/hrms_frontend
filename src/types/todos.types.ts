export type TodoStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

export interface TodoEmployeeRef {
  id: string
  empCode: string
  firstName: string
  lastName: string
  departmentName?: string | null
}

export interface TodoIncentiveRuleRef {
  id: string
  name: string
  rate: number
}

export interface TodoTask {
  id: string
  employeeId: string
  employee: TodoEmployeeRef | null
  incentiveRuleId: string | null
  incentiveRule: TodoIncentiveRuleRef | null
  title: string
  description: string | null
  quantity: number | null
  unit: string | null
  dueDate: string | null
  status: TodoStatus
  submittedAt: string | null
  reviewedBy: string | null
  reviewedAt: string | null
  rejectionNote: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateTodoDto {
  title: string
  description?: string
  incentiveRuleId?: string
  quantity?: number
  unit?: string
  dueDate?: string
  employeeId?: string
}

export interface SubmitTodoDto {
  quantity?: number
  unit?: string
}

export interface ApproveTodoDto {
  approve: boolean
  incentiveRuleId?: string
  hold?: boolean
  payrollMonth?: number
  payrollYear?: number
  rejectionNote?: string
}
