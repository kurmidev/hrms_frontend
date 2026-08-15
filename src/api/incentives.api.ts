import { apiClient, unwrap } from './client'
import type {
  IncentiveRule,
  CreateIncentiveRuleDto,
  UpdateIncentiveRuleDto,
  TodoTask,
  CreateTodoDto,
  SubmitTodoDto,
  ApproveTodoDto,
  IncentiveLedgerEntry,
  ReleaseIncentiveDto,
} from '@/types/incentives.types'
import type { PaginationParams } from '@/types/api.types'

interface TodoParams extends PaginationParams {
  status?: string
  employeeId?: string
}

interface LedgerParams extends PaginationParams {
  employeeId?: string
  isHeld?: boolean
  isDeducted?: boolean
}

export const incentiveRulesApi = {
  list: (params?: PaginationParams) =>
    apiClient.get('/incentive-rules', { params }).then(unwrap),

  get: (id: string) =>
    apiClient.get<{ data: IncentiveRule }>(`/incentive-rules/${id}`).then(unwrap<IncentiveRule>),

  create: (data: CreateIncentiveRuleDto) =>
    apiClient.post<{ data: IncentiveRule }>('/incentive-rules', data).then(unwrap<IncentiveRule>),

  update: (id: string, data: UpdateIncentiveRuleDto) =>
    apiClient.put<{ data: IncentiveRule }>(`/incentive-rules/${id}`, data).then(unwrap<IncentiveRule>),
}

export const todosApi = {
  list: (params?: TodoParams) =>
    apiClient.get('/todos', { params }).then(unwrap),

  get: (id: string) =>
    apiClient.get<{ data: TodoTask }>(`/todos/${id}`).then(unwrap<TodoTask>),

  create: (data: CreateTodoDto) =>
    apiClient.post<{ data: TodoTask }>('/todos', data).then(unwrap<TodoTask>),

  submit: (id: string, data: SubmitTodoDto) =>
    apiClient.put<{ data: TodoTask }>(`/todos/${id}/submit`, data).then(unwrap<TodoTask>),

  approve: (id: string, data: ApproveTodoDto) =>
    apiClient.put<{ data: TodoTask }>(`/todos/${id}/approve`, data).then(unwrap<TodoTask>),
}

export const incentiveLedgerApi = {
  list: (params?: LedgerParams) =>
    apiClient.get('/incentive-ledger', { params }).then(unwrap),

  release: (id: string, data: ReleaseIncentiveDto) =>
    apiClient.put<{ data: IncentiveLedgerEntry }>(`/incentive-ledger/${id}/release`, data).then(unwrap<IncentiveLedgerEntry>),
}
