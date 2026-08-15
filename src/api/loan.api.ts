import { apiClient, unwrap } from './client'
import type {
  Loan,
  LoanEmiSchedule,
  CreateLoanDto,
  ApproveLoanDto,
  RejectLoanDto,
} from '@/types/loan.types'
import type { PaginationParams } from '@/types/api.types'

interface LoanParams extends PaginationParams {
  status?: string
  employeeId?: string
}

export const loanApi = {
  list: (params?: LoanParams) =>
    apiClient.get('/loans', { params }).then(unwrap),

  get: (id: string) =>
    apiClient.get<{ data: Loan }>(`/loans/${id}`).then(unwrap<Loan>),

  apply: (data: CreateLoanDto) =>
    apiClient.post<{ data: Loan }>('/loans', data).then(unwrap<Loan>),

  approve: (id: string, data: ApproveLoanDto) =>
    apiClient.put<{ data: Loan }>(`/loans/${id}/approve`, data).then(unwrap<Loan>),

  reject: (id: string, data: RejectLoanDto) =>
    apiClient.put<{ data: Loan }>(`/loans/${id}/reject`, data).then(unwrap<Loan>),

  getEmiSchedule: (id: string) =>
    apiClient
      .get<{ data: LoanEmiSchedule[] }>(`/loans/${id}/emi-schedule`)
      .then(unwrap<LoanEmiSchedule[]>),
}
