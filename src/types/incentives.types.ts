export type TodoStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

export type IncentiveSource = 'TODO' | 'PROJECT' | 'BONUS' | 'GREEN_THANKS'

export interface IncentiveRule {
  id: string
  organizationId: string
  name: string
  type: string
  category: unknown | null
  rate: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateIncentiveRuleDto {
  name: string
  type: string
  rate: number
  isActive?: boolean
  category?: unknown
}

export type UpdateIncentiveRuleDto = Partial<CreateIncentiveRuleDto>

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
  hold?: boolean
  payrollMonth?: number
  payrollYear?: number
  rejectionNote?: string
}

export interface IncentiveLedgerTodoRef {
  id: string
  title: string
}

export interface IncentiveLedgerEntry {
  id: string
  employeeId: string
  employee: TodoEmployeeRef | null
  todoId: string | null
  todo: IncentiveLedgerTodoRef | null
  source: IncentiveSource
  totalAmount: number
  holdAmount: number
  releaseAmount: number
  payrollMonth: number
  payrollYear: number
  isHeld: boolean
  isReleased: boolean
  isDeducted: boolean
  payrollEntryId: string | null
  releasedAt: string | null
  createdAt: string
}

export interface ReleaseIncentiveDto {
  payrollMonth?: number
  payrollYear?: number
}
