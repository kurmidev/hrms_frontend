import { apiClient, unwrap } from './client'
import type { DisciplinaryMemo, CreateDisciplinaryMemoDto, DisciplinaryEmployeeSummary } from '@/types/disciplinary.types'
import type { PaginationParams } from '@/types/api.types'

interface DisciplinaryParams extends PaginationParams {
  employeeId?: string
  type?: string
  status?: string
}

export const disciplinaryApi = {
  list: (params?: DisciplinaryParams) =>
    apiClient.get('/disciplinary', { params }).then(unwrap),

  get: (id: string) =>
    apiClient.get<{ data: DisciplinaryMemo }>(`/disciplinary/${id}`).then(unwrap<DisciplinaryMemo>),

  create: (data: CreateDisciplinaryMemoDto) =>
    apiClient.post<{ data: DisciplinaryMemo }>('/disciplinary', data).then(unwrap<DisciplinaryMemo>),

  employeeSummary: (employeeId: string) =>
    apiClient
      .get<{ data: DisciplinaryEmployeeSummary }>(`/disciplinary/employee/${employeeId}/summary`)
      .then(unwrap<DisciplinaryEmployeeSummary>),
}
