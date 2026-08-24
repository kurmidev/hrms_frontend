import { toast } from 'sonner'
import { apiClient, unwrap } from './client'
import type {
  AttendanceReport,
  AttendanceTrackReport,
  AuditHistoryReport,
  HeadcountReport,
  IncentiveReport,
  LeaveReport,
  LoanReport,
  PayrollReport,
  PerformanceReport,
  ReportFilters,
  ReportType,
  TodoIncentiveReport,
} from '@/types/reports.types'

function extractFilename(contentDisposition: string | undefined, fallback: string): string {
  if (!contentDisposition) return fallback
  const match = /filename="?([^";]+)"?/i.exec(contentDisposition)
  return match?.[1] ?? fallback
}

export const reportsApi = {
  headcount: (params?: ReportFilters) =>
    apiClient.get<{ data: HeadcountReport }>('/reports/headcount', { params }).then(unwrap<HeadcountReport>),

  attendance: (params?: ReportFilters) =>
    apiClient.get<{ data: AttendanceReport }>('/reports/attendance', { params }).then(unwrap<AttendanceReport>),

  leave: (params?: ReportFilters) =>
    apiClient.get<{ data: LeaveReport }>('/reports/leave', { params }).then(unwrap<LeaveReport>),

  payroll: (params?: ReportFilters) =>
    apiClient.get<{ data: PayrollReport }>('/reports/payroll', { params }).then(unwrap<PayrollReport>),

  loans: (params?: ReportFilters) =>
    apiClient.get<{ data: LoanReport }>('/reports/loans', { params }).then(unwrap<LoanReport>),

  incentives: (params?: ReportFilters) =>
    apiClient.get<{ data: IncentiveReport }>('/reports/incentives', { params }).then(unwrap<IncentiveReport>),

  attendanceTrack: (params?: ReportFilters) =>
    apiClient
      .get<{ data: AttendanceTrackReport }>('/reports/attendance-track', { params })
      .then(unwrap<AttendanceTrackReport>),

  performance: (params?: ReportFilters) =>
    apiClient.get<{ data: PerformanceReport }>('/reports/performance', { params }).then(unwrap<PerformanceReport>),

  todoIncentive: (params?: ReportFilters) =>
    apiClient
      .get<{ data: TodoIncentiveReport }>('/reports/todo-incentive', { params })
      .then(unwrap<TodoIncentiveReport>),

  audit: (params?: ReportFilters) =>
    apiClient.get<{ data: AuditHistoryReport }>('/reports/audit', { params }).then(unwrap<AuditHistoryReport>),

  exportReport: async (
    type: ReportType,
    format: 'excel' | 'pdf',
    params?: ReportFilters
  ): Promise<void> => {
    try {
      const response = await apiClient.get(`/reports/${type}/export`, {
        params: { format, ...params },
        responseType: 'blob',
      })

      const fallbackExt = format === 'excel' ? 'xlsx' : 'pdf'
      const filename = extractFilename(
        response.headers['content-disposition'] as string | undefined,
        `${type}-report.${fallbackExt}`
      )

      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status
      if (status === 400) {
        toast.error('This report type does not support PDF export.')
      } else {
        toast.error('Failed to export report.')
      }
      throw error
    }
  },
}
