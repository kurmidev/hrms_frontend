export type ExitType = 'RESIGNATION' | 'TERMINATION' | 'ABSCONDING' | 'RETIREMENT'
export type ExitStatus = 'INITIATED' | 'CLEARANCE_PENDING' | 'CLEARED' | 'SETTLED' | 'COMPLETED'
export type ExitInitiator = 'SELF' | 'MANAGEMENT'

export interface ExitDepartmentClearance {
  department: string
  cleared: boolean
  clearedBy: string | null
  clearedAt: string | null
}

export interface ExitClearanceStatus {
  departments: ExitDepartmentClearance[]
  assetHandover: { cleared: boolean; unreturnedCount: number }
  knowledgeTransfer: { cleared: boolean }
}

export interface ExitRecord {
  id: string
  organizationId: string
  employeeId: string
  type: ExitType
  status: ExitStatus
  initiatedBy: ExitInitiator
  reason: string
  initiatedAt: string
  noticeStartDate: string | null
  lastWorkingDate: string | null
  effectiveDate: string | null
  targetSettlementDate: string | null
  knowledgeTransferComplete: boolean
  clearanceStatus: ExitClearanceStatus
  nocIssuedAt: string | null
  settlementAmount: number | null
  settledAt: string | null
  completedAt: string | null
  updatedAt: string
}

export interface CreateExitDto {
  employeeId: string
  type: ExitType
  initiatedBy: ExitInitiator
  reason: string
  noticeStartDate?: string
  lastWorkingDate?: string
  effectiveDate?: string
  targetSettlementDate?: string
}

export interface UpdateClearanceDto {
  departments: { department: string; cleared: boolean; clearedBy?: string }[]
  knowledgeTransferComplete?: boolean
  advanceToClearedIfComplete?: boolean
}

export interface SettleExitDto {
  settlementAmount: number
  notes?: string
}

export interface ExitSettlementSummary {
  exitRecord: ExitRecord
  outstandingLoanBalance: number
  unreturnedAssetCount: number
  settlementAmount: number
}
