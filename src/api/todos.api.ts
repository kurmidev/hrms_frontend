import { apiClient, unwrap } from './client'
import type { TodoTask, CreateTodoDto, SubmitTodoDto, ApproveTodoDto } from '@/types/todos.types'
import type { PaginationParams } from '@/types/api.types'

interface TodoParams extends PaginationParams {
  status?: string
  employeeId?: string
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
