import { apiClient, unwrap } from './client'
import type {
  Employee,
  CreateEmployeeDto,
  EmployeeStats,
  UpdateEmployeeAdminDto,
  UpdateEmployeeSelfDto,
  UpdateBankDetailsDto,
  UpdateEmergencyContactDto,
} from '@/types/employee.types'
import type { PaginationParams } from '@/types/api.types'

interface EmployeeParams extends PaginationParams {
  search?: string
  status?: string
  departmentId?: string
  designationId?: string
  employmentType?: string
}

export const employeesApi = {
  list: (params?: EmployeeParams) =>
    apiClient.get('/employees', { params }).then(unwrap),

  trash: (params?: PaginationParams) =>
    apiClient.get('/employees/trash', { params }).then(unwrap),

  get: (id: string) =>
    apiClient.get<{ data: Employee }>(`/employees/${id}`).then(unwrap<Employee>),

  create: (data: CreateEmployeeDto) =>
    apiClient.post<{ data: Employee }>('/employees', data).then(unwrap<Employee>),

  update: (id: string, data: UpdateEmployeeAdminDto) =>
    apiClient.put<{ data: Employee }>(`/employees/${id}`, data).then(unwrap<Employee>),

  // Self-service update — PATCH /employees/:id/self, requires profile:update.
  // Backend enforces the caller can only target their own employee id.
  updateSelf: (id: string, data: UpdateEmployeeSelfDto) =>
    apiClient.patch<{ data: Employee }>(`/employees/${id}/self`, data).then(unwrap<Employee>),

  patchStatus: (id: string, data: { status: string; reason?: string }) =>
    apiClient.patch(`/employees/${id}/status`, data).then(unwrap),

  delete: (id: string) => apiClient.delete(`/employees/${id}`).then(unwrap),

  restore: (id: string) => apiClient.patch(`/employees/${id}/restore`).then(unwrap),

  uploadDocument: (id: string, formData: FormData) =>
    apiClient.post(`/employees/${id}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap),

  uploadPhoto: (id: string, formData: FormData) =>
    apiClient.post(`/employees/${id}/profile-photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(unwrap),

  updateBankDetails: (id: string, data: UpdateBankDetailsDto) =>
    apiClient.patch(`/employees/${id}/bank-details`, data).then(unwrap),

  updateEmergencyContact: (id: string, data: UpdateEmergencyContactDto) =>
    apiClient.patch(`/employees/${id}/emergency-contact`, data).then(unwrap),

  subordinates: (id: string, depth?: number) =>
    apiClient.get(`/employees/${id}/subordinates`, { params: { depth } }).then(unwrap),

  reportingChain: (id: string) =>
    apiClient.get(`/employees/${id}/reporting-chain`).then(unwrap),

  sendPasswordReset: (id: string) =>
    apiClient.post(`/employees/${id}/send-password-reset`).then(unwrap),

  getStats: () =>
    apiClient.get<{ data: EmployeeStats }>('/employees/stats').then(unwrap<EmployeeStats>),
}
