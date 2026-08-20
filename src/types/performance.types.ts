export type PerformanceCycleStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED'

export interface PerformanceCycle {
  id: string
  name: string
  startDate: string
  endDate: string
  status: PerformanceCycleStatus
  closedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface PerformanceRatingPersonRef {
  id: string
  empCode: string
  firstName: string
  lastName: string
}

export interface PerformanceRatingCycleRef {
  id: string
  name: string
  status: PerformanceCycleStatus
}

export interface PerformanceRating {
  id: string
  cycleId: string
  employeeId: string
  ratedBy: string
  rating: number
  comments: string | null
  isEligibleForIncrement: boolean
  submittedAt: string
  updatedAt: string
  employee: PerformanceRatingPersonRef | null
  rater: PerformanceRatingPersonRef | null
  cycle: PerformanceRatingCycleRef | null
}

export interface CreatePerformanceCycleDto {
  name: string
  startDate: string
  endDate: string
  status?: 'DRAFT' | 'ACTIVE'
}

export interface SubmitRatingDto {
  employeeId: string
  rating: number
  comments?: string
  isEligibleForIncrement?: boolean
}

export type EmployeeKpiStatus = 'PENDING' | 'IN_PROGRESS' | 'ACHIEVED' | 'MISSED'

export interface EmployeeKpiRow {
  id: string
  employeeId: string
  employeeName: string
  designationId: string | null
  designationName: string | null
  kpiTitle: string
  // Backend `Kpi.targetValue`/`Kpi.unit` are optional columns (Float?/String?
  // in prisma/schema.prisma) — there is no create-KPI endpoint yet, but the
  // seed data always populates them, so DO NOT widen this back to a
  // non-nullable type without re-checking the schema; a future KPI created
  // without a target would otherwise render "null %" (see KpiPage.tsx render).
  targetValue: number | null
  unit: string | null
  achievedValue: number | null
  status: EmployeeKpiStatus
}

export interface Kpi {
  id: string
  title: string
  designationId: string | null
  designationName: string | null
  targetValue: number | null
  unit: string | null
}
