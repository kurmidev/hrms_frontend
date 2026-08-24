import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  EMPLOYEE_STATUS_LABELS,
  EMPLOYEE_STATUS_COLORS,
  ONBOARDING_STATUS_LABELS,
  ONBOARDING_STATUS_COLORS,
  LEAVE_STATUS_LABELS,
  LEAVE_STATUS_COLORS,
  ATTENDANCE_STATUS_LABELS,
  ATTENDANCE_STATUS_COLORS,
  PAYROLL_RUN_STATUS_LABELS,
  PAYROLL_RUN_STATUS_COLORS,
  LOAN_STATUS_LABELS,
  LOAN_STATUS_COLORS,
  TODO_STATUS_LABELS,
  TODO_STATUS_COLORS,
} from '@/lib/constants'
import type { EmployeeStatus } from '@/types/employee.types'
import type { OnboardingStatus } from '@/types/onboarding.types'

interface Props {
  status: string
  type: 'employee' | 'onboarding' | 'leave' | 'attendance' | 'payroll' | 'loan' | 'todo' | 'generic'
  label?: string
  colorClass?: string
}

export function StatusBadge({ status, type, label, colorClass }: Props) {
  let displayLabel = label ?? status
  let classes = colorClass ?? 'bg-muted text-muted-foreground'

  if (type === 'employee') {
    displayLabel = EMPLOYEE_STATUS_LABELS[status as EmployeeStatus] ?? status
    classes = EMPLOYEE_STATUS_COLORS[status as EmployeeStatus] ?? classes
  } else if (type === 'onboarding') {
    displayLabel = ONBOARDING_STATUS_LABELS[status as OnboardingStatus] ?? status
    classes = ONBOARDING_STATUS_COLORS[status as OnboardingStatus] ?? classes
  } else if (type === 'leave') {
    displayLabel = LEAVE_STATUS_LABELS[status] ?? status
    classes = LEAVE_STATUS_COLORS[status] ?? classes
  } else if (type === 'attendance') {
    displayLabel = ATTENDANCE_STATUS_LABELS[status] ?? status
    classes = ATTENDANCE_STATUS_COLORS[status] ?? classes
  } else if (type === 'payroll') {
    displayLabel = PAYROLL_RUN_STATUS_LABELS[status] ?? status
    classes = PAYROLL_RUN_STATUS_COLORS[status] ?? classes
  } else if (type === 'loan') {
    displayLabel = LOAN_STATUS_LABELS[status] ?? status
    classes = LOAN_STATUS_COLORS[status] ?? classes
  } else if (type === 'todo') {
    displayLabel = TODO_STATUS_LABELS[status] ?? status
    classes = TODO_STATUS_COLORS[status] ?? classes
  }

  return (
    <Badge className={cn('border-0 text-xs font-medium', classes)} variant="secondary">
      {displayLabel}
    </Badge>
  )
}
