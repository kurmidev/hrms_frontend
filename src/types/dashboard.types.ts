import type { OnboardingStatus } from './onboarding.types'

export interface DashboardWidget {
  id?: string
  widgetType: string
  title: string
  position: number
  colSpan: 1 | 2 | 3 | 4
  rowSpan?: 1 | 2
  config?: Record<string, unknown>
}

export interface DashboardConfig {
  id: string
  name: string
  roleName: string | null
  userId: string | null
  isDefault: boolean
  widgets: DashboardWidget[]
}

export interface DashboardLoanLeaveSummary {
  loans: {
    pendingCount: number
    pendingAmount: number
    activeCount: number
    activeOutstandingAmount: number
  }
  leave: {
    pendingCount: number
    onLeaveToday: number
    onLeaveThisWeek: number
  }
}

export interface DashboardAdminAlertOnboardingLink {
  id: string
  candidateName: string | null
  email: string
  expiresAt: string
  status: OnboardingStatus
}

export interface DashboardAdminAlerts {
  onboardingLinksExpiringSoon: {
    count: number
    items: DashboardAdminAlertOnboardingLink[]
  }
  pendingApprovals: {
    leave: number
    loan: number
    serviceRequest: number
    todo: number
  }
}
