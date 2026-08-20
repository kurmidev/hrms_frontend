import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import { AuthLayout } from '@/layouts/AuthLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { PlatformLayout } from '@/layouts/PlatformLayout'
import { ProtectedRoute } from './ProtectedRoute'
import { LoginPage } from '@/features/auth/LoginPage'
import { OtpPage } from '@/features/auth/OtpPage'
import { ChangePasswordPage } from '@/features/auth/ChangePasswordPage'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { OrganizationPage } from '@/features/organization/OrganizationPage'
import { DepartmentsPage } from '@/features/organization/departments/DepartmentsPage'
import { DesignationsPage } from '@/features/organization/designations/DesignationsPage'
import { RolesPage } from '@/features/roles/RolesPage'
import { LeavePoliciesPage } from '@/features/organization/leave-policies/LeavePoliciesPage'
import { PayrollStructuresPage } from '@/features/organization/payroll-structures/PayrollStructuresPage'
import { TaxRulesPage } from '@/features/organization/tax-rules/TaxRulesPage'
import { WorkLocationsPage } from '@/features/organization/work-locations/WorkLocationsPage'
import { EmployeesPage } from '@/features/employees/EmployeesPage'
import { EmployeeProfilePage } from '@/features/employees/EmployeeProfilePage'
import { OnboardingHRPage } from '@/features/onboarding/hr/OnboardingHRPage'
import { OnboardingDetailPage } from '@/features/onboarding/hr/OnboardingDetailPage'
import { OnboardingPublicPage } from '@/features/onboarding/public/OnboardingPublicPage'
import { AttendancePage } from '@/features/attendance/AttendancePage'
import { MyAttendancePage } from '@/features/attendance/MyAttendancePage'
import { LiveTrackingPage } from '@/features/attendance/LiveTrackingPage'
import { OnDutyPage } from '@/features/attendance/OnDutyPage'
import { LeavePage } from '@/features/leave/LeavePage'
import { LeaveApprovalsPage } from '@/features/leave/LeaveApprovalsPage'
import { HolidaysPage } from '@/features/leave/HolidaysPage'
import { PayrollRunsPage } from '@/features/payroll/PayrollRunsPage'
import { PayrollRunDetailPage } from '@/features/payroll/PayrollRunDetailPage'
import { LoansPage } from '@/features/loans/LoansPage'
import { LoanDetailPage } from '@/features/loans/LoanDetailPage'
import { IncentiveRulesPage } from '@/features/incentives/IncentiveRulesPage'
import { TodosPage } from '@/features/incentives/TodosPage'
import { IncentiveLedgerPage } from '@/features/incentives/IncentiveLedgerPage'
import { GreenThanksPage } from '@/features/green-thanks/GreenThanksPage'
import { GreenThanksConfigPage } from '@/features/green-thanks/GreenThanksConfigPage'
import { NoticeBoardPage } from '@/features/notices/NoticeBoardPage'
import { ManageNoticesPage } from '@/features/notices/ManageNoticesPage'
import { PerformanceCyclesPage } from '@/features/performance/PerformanceCyclesPage'
import { PerformanceCycleDetailPage } from '@/features/performance/PerformanceCycleDetailPage'
import { MyRatingsPage } from '@/features/performance/MyRatingsPage'
import { KpiPage } from '@/features/performance/KpiPage'
import { ServiceRequestsPage } from '@/features/service-requests/ServiceRequestsPage'
import { ServiceRequestDetailPage } from '@/features/service-requests/ServiceRequestDetailPage'
import { DisciplinaryPage } from '@/features/disciplinary/DisciplinaryPage'
import { ExitPage } from '@/features/exit/ExitPage'
import { ExitDetailPage } from '@/features/exit/ExitDetailPage'
import { InsurancePage } from '@/features/insurance/InsurancePage'
import { AssetsPage } from '@/features/assets/AssetsPage'
import { AssetDetailPage } from '@/features/assets/AssetDetailPage'
import { MyAssetsPage } from '@/features/assets/MyAssetsPage'
import { ChatPage } from '@/features/chat/ChatPage'
import { SessionsPage } from '@/features/auth/SessionsPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { ReportsPage } from '@/features/reports/ReportsPage'
import { PlatformLoginPage } from '@/features/platform/PlatformLoginPage'
import { PlatformDashboardPage } from '@/features/platform/PlatformDashboardPage'
import { OrganizationsListPage } from '@/features/platform/OrganizationsListPage'
import { OrganizationDetailPage } from '@/features/platform/OrganizationDetailPage'
import { PlansPage } from '@/features/platform/PlansPage'
import { InvoicesPage } from '@/features/platform/InvoicesPage'
import { SuspendedPage } from '@/features/suspended/SuspendedPage'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthLayout />,
    children: [
      { index: true, element: <LoginPage /> },
      { path: 'otp', element: <OtpPage /> },
    ],
  },
  {
    path: '/change-password',
    element: <AuthLayout />,
    children: [{ index: true, element: <ChangePasswordPage /> }],
  },
  {
    path: '/onboarding/:token',
    element: <PublicLayout />,
    children: [{ index: true, element: <OnboardingPublicPage /> }],
  },
  {
    path: '/suspended',
    element: <SuspendedPage />,
  },
  {
    path: '/platform/login',
    element: <PlatformLoginPage />,
  },
  {
    path: '/platform',
    element: <PlatformLayout />,
    children: [
      { index: true, element: <Navigate to="/platform/dashboard" replace /> },
      { path: 'dashboard', element: <PlatformDashboardPage /> },
      { path: 'organizations', element: <OrganizationsListPage /> },
      { path: 'organizations/:id', element: <OrganizationDetailPage /> },
      { path: 'plans', element: <PlansPage /> },
      { path: 'invoices', element: <InvoicesPage /> },
    ],
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'organization', element: <OrganizationPage /> },
      { path: 'organization/departments', element: <DepartmentsPage /> },
      { path: 'organization/designations', element: <DesignationsPage /> },
      { path: 'organization/leave-policies', element: <LeavePoliciesPage /> },
      { path: 'organization/payroll-structures', element: <PayrollStructuresPage /> },
      { path: 'organization/tax-rules', element: <TaxRulesPage /> },
      { path: 'organization/work-locations', element: <WorkLocationsPage /> },
      { path: 'roles', element: <RolesPage /> },
      { path: 'employees', element: <EmployeesPage /> },
      { path: 'employees/:id', element: <EmployeeProfilePage /> },
      { path: 'onboarding', element: <OnboardingHRPage /> },
      { path: 'onboarding/invites/:id', element: <OnboardingDetailPage /> },
      { path: 'attendance', element: <AttendancePage /> },
      { path: 'attendance/my', element: <MyAttendancePage /> },
      { path: 'attendance/live', element: <LiveTrackingPage /> },
      { path: 'attendance/on-duty', element: <OnDutyPage /> },
      { path: 'leave', element: <LeavePage /> },
      { path: 'leave/approvals', element: <LeaveApprovalsPage /> },
      { path: 'leave/holidays', element: <HolidaysPage /> },
      { path: 'payroll', element: <PayrollRunsPage /> },
      { path: 'payroll/runs/:id', element: <PayrollRunDetailPage /> },
      { path: 'loans', element: <LoansPage /> },
      { path: 'loans/:id', element: <LoanDetailPage /> },
      { path: 'incentives/rules', element: <IncentiveRulesPage /> },
      { path: 'incentives/todos', element: <TodosPage /> },
      { path: 'incentives/ledger', element: <IncentiveLedgerPage /> },
      { path: 'green-thanks', element: <GreenThanksPage /> },
      { path: 'green-thanks/config', element: <GreenThanksConfigPage /> },
      { path: 'performance', element: <PerformanceCyclesPage /> },
      { path: 'performance/my-ratings', element: <MyRatingsPage /> },
      { path: 'performance/kpis', element: <KpiPage /> },
      { path: 'performance/:id', element: <PerformanceCycleDetailPage /> },
      { path: 'notices', element: <NoticeBoardPage /> },
      { path: 'notices/manage', element: <ManageNoticesPage /> },
      { path: 'service-requests', element: <ServiceRequestsPage /> },
      { path: 'service-requests/:id', element: <ServiceRequestDetailPage /> },
      { path: 'disciplinary', element: <DisciplinaryPage /> },
      { path: 'exit', element: <ExitPage /> },
      { path: 'exit/:id', element: <ExitDetailPage /> },
      { path: 'insurance', element: <InsurancePage /> },
      { path: 'assets', element: <AssetsPage /> },
      { path: 'assets/my', element: <MyAssetsPage /> },
      { path: 'assets/:id', element: <AssetDetailPage /> },
      { path: 'chat', element: <ChatPage /> },
      { path: 'settings/sessions', element: <SessionsPage /> },
      { path: 'profile', element: <ProfilePage /> },
      { path: 'reports', element: <ReportsPage /> },
    ],
  },
])
