import { useState } from 'react'
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
import { formatCurrency } from '@/lib/utils'
import type {
  AttendanceReportRow,
  IncentiveReportRow,
  LeaveReportRow,
  LoanReportRow,
  ReportType,
} from '@/types/reports.types'

const REPORT_TYPE_OPTIONS: { value: ReportType; label: string }[] = [
  { value: 'headcount', label: 'Headcount' },
  { value: 'attendance', label: 'Attendance' },
  { value: 'leave', label: 'Leave' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'loans', label: 'Loans' },
  { value: 'incentives', label: 'Incentives' },
]

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

  const [reportType, setReportType] = useState<ReportType>('headcount')
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

  const handleTypeChange = (value: string | null) => {
    setReportType((value as ReportType) ?? 'headcount')
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
        <div className="w-14 h-14 bg-rose-100 rounded-xl flex items-center justify-center">
          <ShieldAlert className="h-7 w-7 text-rose-600" />
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
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <FileBarChart className="h-5 w-5 text-indigo-600" />
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
            {reportType === 'payroll' && (
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

        {(reportType === 'attendance' || reportType === 'headcount' || reportType === 'leave') && (
          <>
            <Input type="date" value={from} onChange={(e) => { setFrom(e.target.value); reset() }} className="w-44" placeholder="From" />
            <Input type="date" value={to} onChange={(e) => { setTo(e.target.value); reset() }} className="w-44" placeholder="To" />
          </>
        )}

        {(reportType === 'payroll' || reportType === 'incentives') && (
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
    </div>
  )
}
