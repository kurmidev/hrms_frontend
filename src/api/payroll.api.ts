import { apiClient, unwrap } from './client'
import type {
  PayrollRun,
  PayrollEntry,
  InitiatePayrollRunDto,
  UpdatePayrollEntryDto,
} from '@/types/payroll.types'
import type { PaginationParams } from '@/types/api.types'

interface PayrollRunParams extends PaginationParams {
  status?: string
  month?: number
  year?: number
}

interface PayrollEntryParams extends PaginationParams {
  departmentId?: string
  search?: string
}

export const payrollApi = {
  listRuns: (params?: PayrollRunParams) =>
    apiClient.get('/payroll/runs', { params }).then(unwrap),

  getRun: (id: string) =>
    apiClient.get<{ data: PayrollRun }>(`/payroll/runs/${id}`).then(unwrap<PayrollRun>),

  initiateRun: (data: InitiatePayrollRunDto) =>
    apiClient.post<{ data: PayrollRun }>('/payroll/runs', data).then(unwrap<PayrollRun>),

  approveRun: (id: string) =>
    apiClient.put<{ data: PayrollRun }>(`/payroll/runs/${id}/approve`).then(unwrap<PayrollRun>),

  disburseRun: (id: string) =>
    apiClient.put<{ data: PayrollRun }>(`/payroll/runs/${id}/disburse`).then(unwrap<PayrollRun>),

  listEntries: (id: string, params?: PayrollEntryParams) =>
    apiClient.get(`/payroll/runs/${id}/entries`, { params }).then(unwrap),

  getEntry: (id: string, employeeId: string) =>
    apiClient
      .get<{ data: PayrollEntry }>(`/payroll/runs/${id}/entries/${employeeId}`)
      .then(unwrap<PayrollEntry>),

  updateEntry: (id: string, employeeId: string, data: UpdatePayrollEntryDto) =>
    apiClient
      .put<{ data: PayrollEntry }>(`/payroll/runs/${id}/entries/${employeeId}`, data)
      .then(unwrap<PayrollEntry>),
}
