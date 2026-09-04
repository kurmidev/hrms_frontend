import type { TodoEmployeeRef } from './todos.types'

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
