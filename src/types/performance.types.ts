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
