import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { FileBarChart, Download, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { reportsApi } from '@/api/reports.api'
import { departmentsApi } from '@/api/departments.api'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import type {
  AttendanceReportRow,
  AttendanceTrackReportRow,
  AuditHistoryReportRow,
  IncentiveReportRow,
  LeaveReportRow,
  LoanReportRow,
  PayrollEmployeeRow,
  PerformanceReportRow,
  ReportType,
  TodoIncentiveReportRow,
} from '@/types/reports.types'

const ALL_REPORT_TYPE_OPTIONS: { value: ReportType; label: string }[] = [
  { value: 'headcount', label: 'Headcount' },
  { value: 'attendance', label: 'Attendance Summary' },
  { value: 'leave', label: 'Leave' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'loans', label: 'Loans' },
  { value: 'incentives', label: 'Incentives' },
  { value: 'attendance-track', label: 'Attendance & Live Track' },
  { value: 'performance', label: 'Performance' },
  { value: 'todo-incentive', label: 'Todo & Incentive' },
  { value: 'audit', label: 'Audit Login & History' },
]

function isReportType(value: string | undefined): value is ReportType {
  return ALL_REPORT_TYPE_OPTIONS.some((opt) => opt.value === value)
}

function flatDepts(
  nodes: { id: string; name: string; children: unknown[] }[]
): { id: string; name: string }[] {
  return nodes.flatMap((n) => [
    { id: n.id, name: n.name },
    ...flatDepts(n.children as { id: string; name: string; children: unknown[] }[]),
  ])
}

export function ReportsPage() {
  const canRead = usePermission('report:read')
  const canExport = usePermission('report:export')
  const canAudit = usePermission('report:audit')

  const REPORT_TYPE_OPTIONS = ALL_REPORT_TYPE_OPTIONS.filter((opt) => opt.value !== 'audit' || canAudit)

  const navigate = useNavigate()
  const { type: typeParam } = useParams<{ type?: string }>()
  const [reportType, setReportType] = useState<ReportType>(() => (isReportType(typeParam) ? typeParam : 'headcount'))

  // Keep the selected report in sync when navigated to via a sidebar submenu
  // link (e.g. Reports > Payroll Month-wise), which changes the :type route
  // param without remounting this page.
  useEffect(() => {
    if (isReportType(typeParam) && typeParam !== reportType) {
      setReportType(typeParam)
    }
  }, [typeParam, reportType])
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [departmentId, setDepartmentId] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const { page, limit, setPage, reset } = usePagination()

  const { data: deptTree = [] } = useQuery({
    queryKey: ['departments-tree'],
    queryFn: departmentsApi.tree,
    enabled: canRead,
  })

  const filters = {
    from: from || undefined,
    to: to || undefined,
    departmentId: departmentId || undefined,
    month: month ? Number(month) : undefined,
    year: year ? Number(year) : undefined,
    page,
    limit,
  }

  const { data: headcount, isLoading: headcountLoading } = useQuery({
    queryKey: ['reports', 'headcount', filters],
    queryFn: () => reportsApi.headcount(filters),
    enabled: canRead && reportType === 'headcount',
  })

  const { data: attendance, isLoading: attendanceLoading } = useQuery({
    queryKey: ['reports', 'attendance', filters],
    queryFn: () => reportsApi.attendance(filters),
    enabled: canRead && reportType === 'attendance',
  })

  const { data: leave, isLoading: leaveLoading } = useQuery({
    queryKey: ['reports', 'leave', filters],
    queryFn: () => reportsApi.leave(filters),
    enabled: canRead && reportType === 'leave',
  })

  const { data: payroll, isLoading: payrollLoading } = useQuery({
    queryKey: ['reports', 'payroll', filters],
    queryFn: () => reportsApi.payroll(filters),
    enabled: canRead && reportType === 'payroll',
  })

  const { data: loans, isLoading: loansLoading } = useQuery({
    queryKey: ['reports', 'loans', filters],
    queryFn: () => reportsApi.loans(filters),
    enabled: canRead && reportType === 'loans',
  })

  const { data: incentives, isLoading: incentivesLoading } = useQuery({
    queryKey: ['reports', 'incentives', filters],
    queryFn: () => reportsApi.incentives(filters),
    enabled: canRead && reportType === 'incentives',
  })

  const { data: attendanceTrack, isLoading: attendanceTrackLoading } = useQuery({
    queryKey: ['reports', 'attendance-track', filters],
    queryFn: () => reportsApi.attendanceTrack(filters),
    enabled: canRead && reportType === 'attendance-track',
  })

  const { data: performance, isLoading: performanceLoading } = useQuery({
    queryKey: ['reports', 'performance', filters],
    queryFn: () => reportsApi.performance(filters),
    enabled: canRead && reportType === 'performance',
  })

  const { data: todoIncentive, isLoading: todoIncentiveLoading } = useQuery({
    queryKey: ['reports', 'todo-incentive', filters],
    queryFn: () => reportsApi.todoIncentive(filters),
    enabled: canRead && reportType === 'todo-incentive',
  })

  const { data: audit, isLoading: auditLoading } = useQuery({
    queryKey: ['reports', 'audit', filters],
    queryFn: () => reportsApi.audit(filters),
    enabled: canAudit && reportType === 'audit',
  })

  const handleTypeChange = (value: string | null) => {
    const next = (value as ReportType) ?? 'headcount'
    setReportType(next)
    navigate(`/reports/${next}`, { replace: true })
    reset()
  }

  const handleExport = (format: 'excel' | 'pdf') => {
    void reportsApi.exportReport(reportType, format, filters)
  }

  const attendanceColumns: Column<AttendanceReportRow>[] = [
    { key: 'empCode', header: 'Emp Code' },
    { key: 'name', header: 'Name' },
    { key: 'presentDays', header: 'Present' },
    { key: 'absentDays', header: 'Absent' },
    { key: 'leaveDays', header: 'Leave Days' },
    { key: 'lopDays', header: 'LOP' },
  ]

  const leaveColumns: Column<LeaveReportRow>[] = [
    { key: 'empCode', header: 'Emp Code' },
    { key: 'name', header: 'Name' },
    { key: 'leaveType', header: 'Leave Type' },
    { key: 'entitledDays', header: 'Entitled' },
    { key: 'takenDays', header: 'Taken' },
    { key: 'balanceDays', header: 'Balance' },
  ]

  const loanColumns: Column<LoanReportRow>[] = [
    { key: 'empCode', header: 'Emp Code' },
    { key: 'name', header: 'Name' },
    { key: 'amountRequested', header: 'Requested', render: (r) => formatCurrency(r.amountRequested) },
    { key: 'amountApproved', header: 'Approved', render: (r) => formatCurrency(r.amountApproved) },
    { key: 'status', header: 'Status' },
    { key: 'outstandingBalance', header: 'Outstanding', render: (r) => formatCurrency(r.outstandingBalance) },
  ]

  const incentiveColumns: Column<IncentiveReportRow>[] = [
    { key: 'empCode', header: 'Emp Code' },
    { key: 'name', header: 'Name' },
    { key: 'payrollMonth', header: 'Month' },
    { key: 'payrollYear', header: 'Year' },
    { key: 'totalAmount', header: 'Amount', render: (r) => formatCurrency(r.totalAmount) },
  ]

  const payrollRowColumns: Column<PayrollEmployeeRow>[] = [
    { key: 'empCode', header: 'Emp Code' },
    { key: 'name', header: 'Name' },
    { key: 'grossSalary', header: 'Gross Salary', render: (r) => formatCurrency(r.grossSalary) },
    { key: 'netSalary', header: 'Net Salary', render: (r) => formatCurrency(r.netSalary) },
    { key: 'pfEmployee', header: 'PF (Employee)', render: (r) => formatCurrency(r.pfEmployee) },
    { key: 'esiEmployee', header: 'ESI (Employee)', render: (r) => formatCurrency(r.esiEmployee) },
    { key: 'tds', header: 'TDS', render: (r) => formatCurrency(r.tds) },
    { key: 'loanDeduction', header: 'Loan Deduction', render: (r) => formatCurrency(r.loanDeduction) },
  ]

  const attendanceTrackColumns: Column<AttendanceTrackReportRow>[] = [
    { key: 'empCode', header: 'Emp Code' },
    { key: 'name', header: 'Name' },
    { key: 'date', header: 'Date', render: (r) => formatDateTime(r.date) },
    { key: 'checkInAt', header: 'Check-In', render: (r) => (r.checkInAt ? formatDateTime(r.checkInAt) : '—') },
    { key: 'checkInLocationName', header: 'Check-In Location', render: (r) => r.checkInLocationName ?? '—' },
    { key: 'checkOutAt', header: 'Check-Out', render: (r) => (r.checkOutAt ? formatDateTime(r.checkOutAt) : '—') },
    { key: 'checkOutLocationName', header: 'Check-Out Location', render: (r) => r.checkOutLocationName ?? '—' },
    { key: 'status', header: 'Status' },
    { key: 'totalHours', header: 'Total Hours', render: (r) => r.totalHours ?? '—' },
  ]

  const performanceColumns: Column<PerformanceReportRow>[] = [
    { key: 'empCode', header: 'Emp Code' },
    { key: 'name', header: 'Name' },
    { key: 'cycleName', header: 'Cycle' },
    { key: 'rating', header: 'Rating' },
    { key: 'isEligibleForIncrement', header: 'Eligible for Increment', render: (r) => (r.isEligibleForIncrement ? 'Yes' : 'No') },
    { key: 'kpiAchievedCount', header: 'KPI Achieved/Assigned', render: (r) => `${r.kpiAchievedCount}/${r.kpiAssignedCount}` },
    { key: 'kpiAchievementRate', header: 'Achievement Rate', render: (r) => `${(r.kpiAchievementRate * 100).toFixed(0)}%` },
  ]

  const todoIncentiveColumns: Column<TodoIncentiveReportRow>[] = [
    { key: 'empCode', header: 'Emp Code' },
    { key: 'name', header: 'Name' },
    { key: 'todosTotal', header: 'Todos Total' },
    { key: 'todosApproved', header: 'Approved' },
    { key: 'todosRejected', header: 'Rejected' },
    { key: 'completionRate', header: 'Completion Rate', render: (r) => `${(r.completionRate * 100).toFixed(0)}%` },
    { key: 'incentiveTotalAmount', header: 'Incentive Total', render: (r) => formatCurrency(r.incentiveTotalAmount) },
    { key: 'incentiveReleasedAmount', header: 'Incentive Released', render: (r) => formatCurrency(r.incentiveReleasedAmount) },
  ]

  const auditColumns: Column<AuditHistoryReportRow>[] = [
    { key: 'email', header: 'Email' },
    { key: 'name', header: 'Name' },
    { key: 'ipAddress', header: 'IP Address', render: (r) => r.ipAddress ?? '—' },
    { key: 'loginAt', header: 'Login At', render: (r) => formatDateTime(r.loginAt) },
    { key: 'logoutAt', header: 'Logout At', render: (r) => (r.logoutAt ? formatDateTime(r.logoutAt) : '—') },
    { key: 'status', header: 'Status' },
  ]

  const componentLabels: Record<string, string> = {
    basicSalary: 'Basic Salary',
    hra: 'HRA',
    specialAllowance: 'Special Allowance',
    educationAllowance: 'Education Allowance',
    otherAllowances: 'Other Allowances',
    incentiveAmount: 'Incentive Amount',
    overtimeAmount: 'Overtime Amount',
    travelAllowance: 'Travel Allowance',
    bonus: 'Bonus',
    greenThanksAmount: 'Green Thanks Amount',
    pfEmployee: 'PF (Employee)',
    pfEmployer: 'PF (Employer)',
    esiEmployee: 'ESI (Employee)',
    esiEmployer: 'ESI (Employer)',
    professionalTax: 'Professional Tax',
    tds: 'TDS',
    loanDeduction: 'Loan Deduction',
    advanceDeduction: 'Advance Deduction',
    otherDeductions: 'Other Deductions',
  }

  if (!canRead) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center gap-3">
        <div className="w-14 h-14 bg-accent-red/10 rounded-xl flex items-center justify-center">
          <ShieldAlert className="h-7 w-7 text-accent-red" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          You don't have permission to view reports. Contact your administrator if you believe this is an error.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <FileBarChart className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Reports</h1>
            <p className="text-sm text-muted-foreground">Organization insights and analytics</p>
          </div>
        </div>
        {canExport && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
              <Download className="h-4 w-4 mr-1.5" />
              Export Excel
            </Button>
            {['payroll', 'attendance', 'attendance-track', 'performance', 'todo-incentive', 'audit'].includes(reportType) && (
              <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
                <Download className="h-4 w-4 mr-1.5" />
                Export PDF
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Select
          items={Object.fromEntries(REPORT_TYPE_OPTIONS.map((opt) => [opt.value, opt.label]))}
          value={reportType}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Report Type" />
          </SelectTrigger>
          <SelectContent>
            {REPORT_TYPE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {(
          reportType === 'attendance' ||
          reportType === 'headcount' ||
          reportType === 'leave' ||
          reportType === 'attendance-track' ||
          reportType === 'performance' ||
          reportType === 'todo-incentive' ||
          reportType === 'audit'
        ) && (
          <>
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); reset() }} className="w-44" placeholder="From" />
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); reset() }} className="w-44" placeholder="To" />
          </>
        )}

        {(reportType === 'payroll' || reportType === 'incentives' || reportType === 'todo-incentive') && (
          <>
            <Input
              type="number"
              placeholder="Month"
              value={month}
              onChange={(e) => { setMonth(e.target.value); reset() }}
              className="w-28"
            />
            <Input
              type="number"
              placeholder="Year"
              value={year}
              onChange={(e) => { setYear(e.target.value); reset() }}
              className="w-28"
            />
          </>
        )}

        <Select
          items={{ '': 'All Departments', ...Object.fromEntries(flatDepts(deptTree).map((d) => [d.id, d.name])) }}
          value={departmentId}
          onValueChange={(v) => { setDepartmentId(v ?? ''); reset() }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All Departments" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Departments</SelectItem>
            {flatDepts(deptTree).map((d) => (
              <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {reportType === 'headcount' && (
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Employees</p>
              <p className="text-3xl font-bold text-foreground mt-1">
                {headcountLoading ? '…' : headcount?.total ?? 0}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">By Department</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(headcount?.byDepartment ?? []).map((d) => (
                  <div key={d.departmentId} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{d.departmentName}</span>
                    <span className="font-medium text-muted-foreground">{d.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">By Designation</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(headcount?.byDesignation ?? []).map((d) => (
                  <div key={d.designationId} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{d.designationName}</span>
                    <span className="font-medium text-muted-foreground">{d.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">By Employment Type</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(headcount?.byEmploymentType ?? []).map((d) => (
                  <div key={d.employmentType} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{d.employmentType}</span>
                    <span className="font-medium text-muted-foreground">{d.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader><CardTitle className="text-base">By Status</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {(headcount?.byStatus ?? []).map((d) => (
                  <div key={d.status} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{d.status}</span>
                    <span className="font-medium text-muted-foreground">{d.count}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {reportType === 'attendance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-sm"><CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Present</p>
              <p className="text-2xl font-bold text-foreground mt-1">{attendance?.totalPresent ?? 0}</p>
            </CardContent></Card>
            <Card className="shadow-sm"><CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Absent</p>
              <p className="text-2xl font-bold text-foreground mt-1">{attendance?.totalAbsent ?? 0}</p>
            </CardContent></Card>
            <Card className="shadow-sm"><CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total LOP</p>
              <p className="text-2xl font-bold text-foreground mt-1">{attendance?.totalLop ?? 0}</p>
            </CardContent></Card>
          </div>
          <DataTable
            columns={attendanceColumns}
            data={attendance?.rows ?? []}
            isLoading={attendanceLoading}
            pagination={attendance?.meta}
            onPageChange={setPage}
            rowKey={(r) => r.employeeId}
            emptyMessage="No attendance data found."
          />
        </div>
      )}

      {reportType === 'leave' && (
        <div className="space-y-4">
          <Card className="shadow-sm"><CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Pending Applications</p>
            <p className="text-2xl font-bold text-foreground mt-1">{leave?.pendingApplications ?? 0}</p>
          </CardContent></Card>
          <DataTable
            columns={leaveColumns}
            data={leave?.rows ?? []}
            isLoading={leaveLoading}
            pagination={leave?.meta}
            onPageChange={setPage}
            rowKey={(r) => `${r.employeeId}-${r.leavePolicyId}`}
            emptyMessage="No leave data found."
          />
        </div>
      )}

      {reportType === 'payroll' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="shadow-sm"><CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Employees</p>
              <p className="text-2xl font-bold text-foreground mt-1">{payrollLoading ? '…' : payroll?.employeeCount ?? 0}</p>
            </CardContent></Card>
            <Card className="shadow-sm"><CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Gross</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(payroll?.totalGross)}</p>
            </CardContent></Card>
            <Card className="shadow-sm"><CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Disbursed</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(payroll?.totalDisbursed)}</p>
            </CardContent></Card>
            <Card className="shadow-sm"><CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-2xl font-bold text-foreground mt-1">{payroll?.status ?? '—'}</p>
            </CardContent></Card>
          </div>
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Component Breakdown</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {payroll &&
                Object.entries(payroll.componentBreakdown).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between text-sm">
                    <span className="text-foreground">{componentLabels[key] ?? key}</span>
                    <span className="font-medium text-muted-foreground">{formatCurrency(value)}</span>
                  </div>
                ))}
            </CardContent>
          </Card>
          <DataTable
            columns={payrollRowColumns}
            data={payroll?.rows ?? []}
            isLoading={payrollLoading}
            pagination={payroll?.meta}
            onPageChange={setPage}
            rowKey={(r) => r.employeeId}
            emptyMessage="No payroll data found."
          />
        </div>
      )}

      {reportType === 'loans' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="shadow-sm"><CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Active Loans</p>
              <p className="text-2xl font-bold text-foreground mt-1">{loans?.activeLoanCount ?? 0}</p>
            </CardContent></Card>
            <Card className="shadow-sm"><CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Outstanding</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(loans?.totalOutstanding)}</p>
            </CardContent></Card>
          </div>
          <DataTable
            columns={loanColumns}
            data={loans?.rows ?? []}
            isLoading={loansLoading}
            pagination={loans?.meta}
            onPageChange={setPage}
            rowKey={(r) => r.loanId}
            emptyMessage="No loan data found."
          />
        </div>
      )}

      {reportType === 'incentives' && (
        <div className="space-y-4">
          <Card className="shadow-sm"><CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(incentives?.totalAmount)}</p>
          </CardContent></Card>
          <DataTable
            columns={incentiveColumns}
            data={incentives?.rows ?? []}
            isLoading={incentivesLoading}
            pagination={incentives?.meta}
            onPageChange={setPage}
            rowKey={(r) => `${r.employeeId}-${r.payrollMonth}-${r.payrollYear}`}
            emptyMessage="No incentive data found."
          />
        </div>
      )}

      {reportType === 'attendance-track' && (
        <div className="space-y-4">
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">Live Now</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(attendanceTrack?.liveNow ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No employees currently checked in.</p>
              )}
              {(attendanceTrack?.liveNow ?? []).map((l) => (
                <div key={l.employeeId} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{l.name} ({l.empCode})</span>
                  <span className="font-medium text-muted-foreground">
                    {l.lat.toFixed(4)}, {l.lng.toFixed(4)} — {formatDateTime(l.recordedAt)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
          <DataTable
            columns={attendanceTrackColumns}
            data={attendanceTrack?.rows ?? []}
            isLoading={attendanceTrackLoading}
            pagination={attendanceTrack?.meta}
            onPageChange={setPage}
            rowKey={(r) => `${r.employeeId}-${r.date}`}
            emptyMessage="No attendance track data found."
          />
        </div>
      )}

      {reportType === 'performance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="shadow-sm"><CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Avg Rating</p>
              <p className="text-2xl font-bold text-foreground mt-1">{performance?.avgRating?.toFixed(2) ?? '—'}</p>
            </CardContent></Card>
            <Card className="shadow-sm"><CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Ratings</p>
              <p className="text-2xl font-bold text-foreground mt-1">{performance?.totalRatingsCount ?? 0}</p>
            </CardContent></Card>
          </div>
          <DataTable
            columns={performanceColumns}
            data={performance?.rows ?? []}
            isLoading={performanceLoading}
            pagination={performance?.meta}
            onPageChange={setPage}
            rowKey={(r) => `${r.employeeId}-${r.cycleId}`}
            emptyMessage="No performance data found."
          />
        </div>
      )}

      {reportType === 'todo-incentive' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card className="shadow-sm"><CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Org Todos Approved</p>
              <p className="text-2xl font-bold text-foreground mt-1">{todoIncentive?.orgTodosApproved ?? 0}</p>
            </CardContent></Card>
            <Card className="shadow-sm"><CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Org Incentive Total</p>
              <p className="text-2xl font-bold text-foreground mt-1">{formatCurrency(todoIncentive?.orgIncentiveTotalAmount)}</p>
            </CardContent></Card>
          </div>
          <DataTable
            columns={todoIncentiveColumns}
            data={todoIncentive?.rows ?? []}
            isLoading={todoIncentiveLoading}
            pagination={todoIncentive?.meta}
            onPageChange={setPage}
            rowKey={(r) => r.employeeId}
            emptyMessage="No todo/incentive data found."
          />
        </div>
      )}

      {reportType === 'audit' && canAudit && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="shadow-sm"><CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Total Logins</p>
              <p className="text-2xl font-bold text-foreground mt-1">{audit?.totalLogins ?? 0}</p>
            </CardContent></Card>
            <Card className="shadow-sm"><CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Failed Logins</p>
              <p className="text-2xl font-bold text-foreground mt-1">{audit?.failedLogins ?? 0}</p>
            </CardContent></Card>
            <Card className="shadow-sm"><CardContent className="p-5">
              <p className="text-sm text-muted-foreground">Unique Users</p>
              <p className="text-2xl font-bold text-foreground mt-1">{audit?.uniqueUsers ?? 0}</p>
            </CardContent></Card>
          </div>
          <DataTable
            columns={auditColumns}
            data={audit?.rows ?? []}
            isLoading={auditLoading}
            pagination={audit?.meta}
            onPageChange={setPage}
            rowKey={(r) => `${r.userId}-${r.loginAt}`}
            emptyMessage="No login history found."
          />
          <Card className="shadow-sm">
            <CardHeader><CardTitle className="text-base">System Changes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {(audit?.systemChanges ?? []).length === 0 && (
                <p className="text-sm text-muted-foreground">No system change records found.</p>
              )}
              {(audit?.systemChanges ?? []).map((c, idx) => (
                <div key={`${c.entityType}-${c.entityId}-${idx}`} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{c.action} — {c.entityType}</span>
                  <span className="font-medium text-muted-foreground">{formatDateTime(c.occurredAt)}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {reportType === 'audit' && !canAudit && (
        <div className="flex flex-col items-center justify-center h-[40vh] text-center gap-3">
          <div className="w-14 h-14 bg-accent-red/10 rounded-xl flex items-center justify-center">
            <ShieldAlert className="h-7 w-7 text-accent-red" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground max-w-sm">
            You don't have permission to view the audit report.
          </p>
        </div>
      )}
    </div>
  )
}
