export type AssetType = 'LAPTOP' | 'ID_CARD' | 'SIM' | 'VEHICLE' | 'OTHER'

export type AssetStatus =
  | 'AVAILABLE'
  | 'ASSIGNED'
  | 'UNDER_MAINTENANCE'
  | 'RETIRED'
  | 'RETURNED'
  | 'DAMAGED'
  | 'LOST'

export interface Asset {
  id: string
  organizationId: string
  type: string
  name: string
  serialNumber: string | null
  status: AssetStatus
  purchaseDate: string | null
  purchaseValue: number | null
  createdAt: string
  updatedAt: string
  assignments?: AssetAssignment[]
}

export interface AssetAssignment {
  id: string
  assetId: string
  employeeId: string
  assignedAt: string
  returnedAt: string | null
  conditionOnIssue: string | null
  conditionOnReturn: string | null
  approvedBy: string | null
  notes: string | null
  recoveredAtExit: boolean
  recoveryNotes: string | null
  asset?: Asset
}

export interface CreateAssetDto {
  type: string
  name: string
  serialNumber?: string
  purchaseDate?: string
  purchaseValue?: number
}

export interface AssignAssetDto {
  employeeId: string
  conditionOnIssue?: string
  notes?: string
}

export interface ReturnAssetDto {
  conditionOnReturn?: string
  newStatus?: AssetStatus
  notes?: string
}
