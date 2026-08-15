export interface WidgetCatalogEntry {
  type: string
  label: string
  description: string
  defaultColSpan: 1 | 2 | 3 | 4
  defaultRowSpan: 1 | 2
  category: 'kpi' | 'chart' | 'table' | 'clock' | 'schedule' | 'activity'
  roles: string[]
}

export const WIDGET_CATALOG: WidgetCatalogEntry[] = [
  { type: 'kpi_total_employees', label: 'Total Employees', description: 'Count of all employees', defaultColSpan: 1, defaultRowSpan: 1, category: 'kpi', roles: ['super_admin', 'org_admin', 'hr_manager'] },
  { type: 'kpi_active_employees', label: 'Active Employees', description: 'Count of active employees', defaultColSpan: 1, defaultRowSpan: 1, category: 'kpi', roles: ['super_admin', 'org_admin', 'hr_manager'] },
  { type: 'kpi_on_leave', label: 'On Leave Today', description: 'Employees on approved leave today', defaultColSpan: 1, defaultRowSpan: 1, category: 'kpi', roles: ['super_admin', 'org_admin', 'hr_manager', 'dept_manager'] },
  { type: 'kpi_attendance_rate', label: 'Attendance Rate', description: "Today's attendance percentage", defaultColSpan: 1, defaultRowSpan: 1, category: 'kpi', roles: ['super_admin', 'org_admin', 'hr_manager', 'dept_manager'] },
  { type: 'kpi_pending_approvals', label: 'Pending Approvals', description: 'Requests awaiting your approval', defaultColSpan: 1, defaultRowSpan: 1, category: 'kpi', roles: ['super_admin', 'org_admin', 'hr_manager', 'dept_manager', 'finance_manager'] },
  { type: 'kpi_payroll_total', label: 'Monthly Payroll', description: 'Total payroll for current month', defaultColSpan: 1, defaultRowSpan: 1, category: 'kpi', roles: ['super_admin', 'org_admin', 'finance_manager'] },
  { type: 'kpi_open_loans', label: 'Open Loans', description: 'Count of active employee loans', defaultColSpan: 1, defaultRowSpan: 1, category: 'kpi', roles: ['super_admin', 'org_admin', 'finance_manager'] },
  { type: 'kpi_open_assets', label: 'Assigned Assets', description: 'Count of assets currently assigned', defaultColSpan: 1, defaultRowSpan: 1, category: 'kpi', roles: ['super_admin', 'org_admin', 'hr_manager', 'it_admin'] },
  { type: 'kpi_open_tickets', label: 'Open Tickets', description: 'Unresolved support tickets', defaultColSpan: 1, defaultRowSpan: 1, category: 'kpi', roles: ['super_admin', 'org_admin', 'it_admin'] },
  { type: 'kpi_my_leave_balance', label: 'My Leave Balance', description: 'Your remaining leave days', defaultColSpan: 1, defaultRowSpan: 1, category: 'kpi', roles: ['employee', 'field_supervisor'] },
  { type: 'kpi_my_performance', label: 'My Performance', description: 'Your current performance score', defaultColSpan: 1, defaultRowSpan: 1, category: 'kpi', roles: ['employee'] },
  { type: 'chart_employee_status', label: 'Employee Status', description: 'Breakdown by employment status', defaultColSpan: 2, defaultRowSpan: 1, category: 'chart', roles: ['super_admin', 'org_admin', 'hr_manager'] },
  { type: 'chart_employee_type', label: 'Employee Type', description: 'Full-time vs part-time vs contract', defaultColSpan: 2, defaultRowSpan: 1, category: 'chart', roles: ['super_admin', 'org_admin', 'hr_manager'] },
  { type: 'chart_attendance_bar', label: 'Attendance Trend', description: 'Weekly attendance bar chart', defaultColSpan: 2, defaultRowSpan: 1, category: 'chart', roles: ['super_admin', 'org_admin', 'hr_manager', 'dept_manager'] },
  { type: 'chart_leave_distribution', label: 'Leave Distribution', description: 'Leave types pie chart', defaultColSpan: 2, defaultRowSpan: 1, category: 'chart', roles: ['super_admin', 'org_admin', 'hr_manager'] },
  { type: 'chart_payroll_trend', label: 'Payroll Trend', description: 'Monthly payroll trend line chart', defaultColSpan: 4, defaultRowSpan: 1, category: 'chart', roles: ['super_admin', 'org_admin', 'finance_manager'] },
  { type: 'chart_department_headcount', label: 'Dept Headcount', description: 'Headcount by department', defaultColSpan: 2, defaultRowSpan: 1, category: 'chart', roles: ['super_admin', 'org_admin', 'hr_manager', 'dept_manager'] },
  { type: 'table_recent_joiners', label: 'Recent Joiners', description: 'Employees who joined recently', defaultColSpan: 2, defaultRowSpan: 1, category: 'table', roles: ['super_admin', 'org_admin', 'hr_manager'] },
  { type: 'table_pending_leaves', label: 'Pending Leaves', description: 'Leave requests awaiting approval', defaultColSpan: 2, defaultRowSpan: 1, category: 'table', roles: ['super_admin', 'org_admin', 'hr_manager', 'dept_manager'] },
  { type: 'table_late_arrivals', label: 'Late Arrivals', description: 'Employees who arrived late today', defaultColSpan: 4, defaultRowSpan: 1, category: 'table', roles: ['super_admin', 'org_admin', 'hr_manager', 'dept_manager'] },
  { type: 'table_pending_onboarding', label: 'Pending Onboarding', description: 'Employees in onboarding process', defaultColSpan: 2, defaultRowSpan: 1, category: 'table', roles: ['super_admin', 'org_admin', 'hr_manager'] },
  { type: 'table_pending_loans', label: 'Pending Loans', description: 'Loan applications pending review', defaultColSpan: 4, defaultRowSpan: 1, category: 'table', roles: ['super_admin', 'org_admin', 'finance_manager'] },
  { type: 'clock_checkin', label: 'Check In/Out', description: 'Quick attendance check in/out widget', defaultColSpan: 2, defaultRowSpan: 1, category: 'clock', roles: ['employee', 'field_supervisor'] },
  { type: 'schedule_upcoming', label: 'Upcoming Schedule', description: 'Your upcoming shifts and meetings', defaultColSpan: 2, defaultRowSpan: 1, category: 'schedule', roles: ['employee', 'field_supervisor', 'dept_manager'] },
  { type: 'activity_recent', label: 'Recent Activity', description: 'Latest activity in your organization', defaultColSpan: 2, defaultRowSpan: 1, category: 'activity', roles: ['super_admin', 'org_admin', 'hr_manager'] },
]
