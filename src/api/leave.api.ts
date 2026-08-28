import { apiClient, unwrap } from './client'
import type {
  LeaveBalance,
  LeaveApplication,
  Holiday,
  ApplyLeaveDto,
  DecideLeaveDto,
  RejectLeaveDto,
  CreateHolidayDto,
  UpdateHolidayDto,
} from '@/types/leave.types'
import type { PaginationParams } from '@/types/api.types'

interface LeaveParams extends PaginationParams {
  status?: string
  employeeId?: string
  fromDate?: string
  toDate?: string
}

export const leaveApi = {
  getPolicies: () =>
    apiClient.get('/leave/policies').then(unwrap),

  getBalances: () =>
    apiClient.get('/leave/balances').then(unwrap),

  getMyBalance: () =>
    apiClient.get<{ data: LeaveBalance[] }>('/leave/my-balance').then(unwrap<LeaveBalance[]>),

  list: (params?: LeaveParams) =>
    apiClient.get('/leave', { params }).then(unwrap),

  myList: (params?: LeaveParams) =>
    apiClient.get('/leave/my', { params }).then(unwrap),

  apply: (data: ApplyLeaveDto) =>
    apiClient.post<{ data: LeaveApplication }>('/leave/apply', data).then(unwrap<LeaveApplication>),

  cancel: (id: string) =>
    apiClient.put<{ data: LeaveApplication }>(`/leave/${id}/cancel`).then(unwrap<LeaveApplication>),

  approve: (id: string, data?: DecideLeaveDto) =>
    apiClient.put<{ data: LeaveApplication }>(`/leave/${id}/approve`, data).then(unwrap<LeaveApplication>),

  reject: (id: string, data?: RejectLeaveDto) =>
    apiClient.put<{ data: LeaveApplication }>(`/leave/${id}/reject`, data).then(unwrap<LeaveApplication>),

  getHolidays: (year?: number) =>
    apiClient.get('/leave/holidays', { params: { year } }).then(unwrap),

  createHoliday: (data: CreateHolidayDto) =>
    apiClient.post<{ data: Holiday }>('/leave/holidays', data).then(unwrap<Holiday>),

  updateHoliday: (id: string, data: UpdateHolidayDto) =>
    apiClient.put<{ data: Holiday }>(`/leave/holidays/${id}`, data).then(unwrap<Holiday>),

  deleteHoliday: (id: string) =>
    apiClient.delete(`/leave/holidays/${id}`).then(unwrap),
}
