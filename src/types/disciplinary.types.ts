export type DisciplinaryActionType = 'VERBAL_WARNING' | 'WRITTEN_WARNING' | 'DEMOTION' | 'SUSPENSION'

export interface DisciplinaryMemo {
  id: string
  organizationId: string
  employeeId: string
  title: string
  type: DisciplinaryActionType
  reason: string
  issuedBy: string
  issuingAuthority: string | null
  approvalReference: string | null
  issuedAt: string
  acknowledgedAt: string | null
  status: string
  updatedAt: string
  terminationReviewTriggered?: boolean
}

export interface CreateDisciplinaryMemoDto {
  employeeId: string
  type: DisciplinaryActionType
  title: string
  reason: string
  issuingAuthority?: string
  approvalReference?: string
  issuedAt?: string
}

export interface DisciplinaryEmployeeSummary {
  employeeId: string
  activeMemoCount: number
  threshold: number
  flaggedForTerminationReview: boolean
}
