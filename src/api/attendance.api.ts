import { apiClient, unwrap } from './client'
import type {
  AttendanceLog,
  LiveLocation,
  CheckInDto,
  CheckOutDto,
  ManualEntryDto,
  CorrectionRequestDto,
  ApproveCorrectionDto,
} from '@/types/attendance.types'
import type { PaginationParams } from '@/types/api.types'

interface AttendanceParams extends PaginationParams {
  employeeId?: string
  date?: string
  status?: string
  fromDate?: string
  toDate?: string
}

export const attendanceApi = {
  checkIn: (data: CheckInDto) =>
    apiClient.post<{ data: AttendanceLog }>('/attendance/check-in', data).then(unwrap<AttendanceLog>),

  checkOut: (data: CheckOutDto) =>
    apiClient.post<{ data: AttendanceLog }>('/attendance/check-out', data).then(unwrap<AttendanceLog>),

  liveUpdate: (data: { lat: number; lng: number; accuracy?: number }) =>
    apiClient.post<{ data: LiveLocation }>('/attendance/live-location', data).then(unwrap<LiveLocation>),

  getLive: () =>
    apiClient.get('/attendance/live').then(unwrap),

  list: (params?: AttendanceParams) =>
    apiClient.get('/attendance', { params }).then(unwrap),

  myAttendance: (params?: AttendanceParams) =>
    apiClient.get('/attendance/my', { params }).then(unwrap),

  manualEntry: (data: ManualEntryDto) =>
    apiClient.post<{ data: AttendanceLog }>('/attendance/manual', data).then(unwrap<AttendanceLog>),

  requestCorrection: (data: CorrectionRequestDto) =>
    apiClient.post('/attendance/correction-request', data).then(unwrap),

  approveCorrection: (id: string, data: ApproveCorrectionDto) =>
    apiClient.put<{ data: AttendanceLog }>(`/attendance/correction/${id}/approve`, data).then(unwrap<AttendanceLog>),
}
