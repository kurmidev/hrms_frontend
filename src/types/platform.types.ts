export type BillingCycle = 'MONTHLY' | 'QUARTERLY' | 'YEARLY'
export type SubscriptionStatus = 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED'
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE' | 'VOID'

export interface PlatformAdmin {
  id: string
  email: string
  name: string
  isActive: boolean
  lastLoginAt: string | null
}

export interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  maxEmployees: number
  priceMonthly: number
  priceQuarterly: number
  priceYearly: number
  features: string[]
  isActive: boolean
  sortOrder: number
}

export interface OrganizationSubscription {
  id: string
  organizationId: string
  planId: string
  plan: SubscriptionPlan
  billingCycle: BillingCycle
  status: SubscriptionStatus
  gracePeriodDays: number
  currentPeriodStart: string
  currentPeriodEnd: string
  nextBillingDate: string
  cancelledAt: string | null
}

export interface Invoice {
  id: string
  invoiceNumber: string
  organizationId: string
  subscriptionId: string
  amount: number
  taxPercent: number
  taxAmount: number
  totalAmount: number
  currency: string
  status: InvoiceStatus
  dueDate: string
  paidAt: string | null
  periodStart: string
  periodEnd: string
  notes: string | null
  createdAt: string
  organization?: { id: string; name: string }
}

export interface Payment {
  id: string
  invoiceId: string
  amount: number
  paymentDate: string
  paymentMethod: string
  referenceNumber: string | null
  notes: string | null
}

export interface PlatformOrg {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  email: string | null
  phone: string | null
  isActive: boolean
  subscription: OrganizationSubscription | null
}
