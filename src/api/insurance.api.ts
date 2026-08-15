import { apiClient, unwrap } from './client'
import type {
  InsurancePolicy,
  CreateInsurancePolicyDto,
  EmployeeInsurance,
  EnrollInsuranceDto,
  UpdateEnrollmentDto,
  ApproveEnrollmentDto,
} from '@/types/insurance.types'
import type { PaginationParams } from '@/types/api.types'

interface EnrollmentParams extends PaginationParams {
  employeeId?: string
  policyId?: string
  status?: string
}

export const insuranceApi = {
  listPolicies: (params?: PaginationParams) =>
    apiClient.get('/insurance/policies', { params }).then(unwrap),

  getPolicy: (id: string) =>
    apiClient.get<{ data: InsurancePolicy }>(`/insurance/policies/${id}`).then(unwrap<InsurancePolicy>),

  createPolicy: (data: CreateInsurancePolicyDto) =>
    apiClient.post<{ data: InsurancePolicy }>('/insurance/policies', data).then(unwrap<InsurancePolicy>),

  updatePolicy: (id: string, data: Partial<CreateInsurancePolicyDto>) =>
    apiClient.put<{ data: InsurancePolicy }>(`/insurance/policies/${id}`, data).then(unwrap<InsurancePolicy>),

  enroll: (data: EnrollInsuranceDto) =>
    apiClient.post<{ data: EmployeeInsurance }>('/insurance/enroll', data).then(unwrap<EmployeeInsurance>),

  listEnrollments: (params?: EnrollmentParams) =>
    apiClient.get('/insurance/enrollments', { params }).then(unwrap),

  getEnrollment: (id: string) =>
    apiClient.get<{ data: EmployeeInsurance }>(`/insurance/enrollments/${id}`).then(unwrap<EmployeeInsurance>),

  updateEnrollment: (id: string, data: UpdateEnrollmentDto) =>
    apiClient.put<{ data: EmployeeInsurance }>(`/insurance/enrollments/${id}`, data).then(unwrap<EmployeeInsurance>),

  approveEnrollment: (id: string, data: ApproveEnrollmentDto) =>
    apiClient
      .put<{ data: EmployeeInsurance }>(`/insurance/enrollments/${id}/approve`, data)
      .then(unwrap<EmployeeInsurance>),
}
