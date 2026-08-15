import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { platformOrgsApi } from '@/api/platform-organizations.api'
import { platformInvoicesApi } from '@/api/platform-invoices.api'
import { usePlatformAuthStore } from '@/store/platform-auth.store'
import { toast } from 'sonner'
import type { Invoice, InvoiceStatus } from '@/types/platform.types'

type SubscriptionStatusType = 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED'

function subStatusBadge(status: SubscriptionStatusType | undefined) {
  if (!status) return null
  const map: Record<SubscriptionStatusType, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    PAST_DUE: 'bg-yellow-100 text-yellow-700',
    SUSPENDED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-500',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

function invoiceStatusBadge(status: InvoiceStatus) {
  const map: Record<InvoiceStatus, string> = {
    DRAFT: 'bg-slate-100 text-slate-600',
    SENT: 'bg-blue-100 text-blue-700',
    PAID: 'bg-green-100 text-green-700',
    OVERDUE: 'bg-red-100 text-red-700',
    VOID: 'bg-slate-100 text-slate-400',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {status}
    </span>
  )
}

interface MarkPaidForm {
  paymentDate: string
  paymentMethod: string
  referenceNumber: string
  amount: string
  notes: string
}

const INITIAL_PAID_FORM: MarkPaidForm = {
  paymentDate: new Date().toISOString().split('T')[0],
  paymentMethod: '',
  referenceNumber: '',
  amount: '',
  notes: '',
}

export function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { admin } = usePlatformAuthStore()
  const [activeTab, setActiveTab] = useState<'subscription' | 'invoices'>('subscription')
  const [markPaidInvoice, setMarkPaidInvoice] = useState<Invoice | null>(null)
  const [paidForm, setPaidForm] = useState<MarkPaidForm>(INITIAL_PAID_FORM)
  const [paidErrors, setPaidErrors] = useState<Partial<Record<keyof MarkPaidForm, string>>>({})

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['platform', 'org', id],
    queryFn: () => platformOrgsApi.get(id!),
    enabled: !!id,
  })

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: ['platform', 'org', id, 'invoices'],
    queryFn: () => platformInvoicesApi.listByOrg(id!),
    enabled: !!id && activeTab === 'invoices',
  })

  const suspendMutation = useMutation({
    mutationFn: () => platformOrgsApi.suspend(id!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'org', id] })
      void queryClient.invalidateQueries({ queryKey: ['platform', 'orgs'] })
      toast.success('Organization suspended')
    },
    onError: () => toast.error('Failed to suspend'),
  })

  const activateMutation = useMutation({
    mutationFn: () => platformOrgsApi.activate(id!),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'org', id] })
      void queryClient.invalidateQueries({ queryKey: ['platform', 'orgs'] })
      toast.success('Organization activated')
    },
    onError: () => toast.error('Failed to activate'),
  })

  const markPaidMutation = useMutation({
    mutationFn: () =>
      platformInvoicesApi.markPaid(markPaidInvoice!.id, {
        paymentDate: paidForm.paymentDate,
        paymentMethod: paidForm.paymentMethod,
        referenceNumber: paidForm.referenceNumber || undefined,
        notes: paidForm.notes || undefined,
        amount: Number(paidForm.amount),
        recordedById: admin?.id ?? '',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'org', id, 'invoices'] })
      setMarkPaidInvoice(null)
      setPaidForm(INITIAL_PAID_FORM)
      toast.success('Invoice marked as paid')
    },
    onError: () => toast.error('Failed to mark as paid'),
  })

  function setPaidField<K extends keyof MarkPaidForm>(key: K, value: string) {
    setPaidForm((prev) => ({ ...prev, [key]: value }))
    setPaidErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validatePaidForm() {
    const errs: Partial<Record<keyof MarkPaidForm, string>> = {}
    if (!paidForm.paymentDate) errs.paymentDate = 'Required'
    if (!paidForm.paymentMethod.trim()) errs.paymentMethod = 'Required'
    if (!paidForm.amount || isNaN(Number(paidForm.amount))) errs.amount = 'Valid amount required'
    setPaidErrors(errs)
    return Object.keys(errs).length === 0
  }

  function openMarkPaid(invoice: Invoice) {
    setMarkPaidInvoice(invoice)
    setPaidForm({ ...INITIAL_PAID_FORM, amount: String(invoice.totalAmount) })
    setPaidErrors({})
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (orgLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Loading...</p>
      </div>
    )
  }

  if (!org) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-slate-400">Organization not found</p>
      </div>
    )
  }

  const sub = org.subscription

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">{org.name}</h1>
        <p className="text-slate-400 text-sm mt-1">{org.email ?? org.slug}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-800">
        {(['subscription', 'invoices'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-blue-500 text-white' : 'border-transparent text-slate-400 hover:text-white'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Subscription Tab */}
      {activeTab === 'subscription' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white">Subscription Details</h2>
            <div className="flex gap-2">
              {sub?.status === 'SUSPENDED' ? (
                <button
                  onClick={() => activateMutation.mutate()}
                  disabled={activateMutation.isPending}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Activate
                </button>
              ) : (
                <button
                  onClick={() => suspendMutation.mutate()}
                  disabled={suspendMutation.isPending}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Suspend
                </button>
              )}
            </div>
          </div>
          {sub ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Plan</p>
                <p className="text-white font-medium mt-0.5">{sub.plan?.name ?? '—'}</p>
              </div>
              <div>
                <p className="text-slate-400">Status</p>
                <div className="mt-0.5">
                  {subStatusBadge(sub.status as SubscriptionStatusType | undefined)}
                </div>
              </div>
              <div>
                <p className="text-slate-400">Billing Cycle</p>
                <p className="text-white font-medium mt-0.5">{sub.billingCycle}</p>
              </div>
              <div>
                <p className="text-slate-400">Grace Period</p>
                <p className="text-white font-medium mt-0.5">{sub.gracePeriodDays} days</p>
              </div>
              <div>
                <p className="text-slate-400">Current Period Start</p>
                <p className="text-white font-medium mt-0.5">{formatDate(sub.currentPeriodStart)}</p>
              </div>
              <div>
                <p className="text-slate-400">Current Period End</p>
                <p className="text-white font-medium mt-0.5">{formatDate(sub.currentPeriodEnd)}</p>
              </div>
              <div>
                <p className="text-slate-400">Next Billing Date</p>
                <p className="text-white font-medium mt-0.5">{formatDate(sub.nextBillingDate)}</p>
              </div>
              {sub.cancelledAt && (
                <div>
                  <p className="text-slate-400">Cancelled At</p>
                  <p className="text-white font-medium mt-0.5">{formatDate(sub.cancelledAt)}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-slate-500">No active subscription</p>
          )}
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Invoice #</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Amount</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Due Date</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-slate-400 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoicesLoading && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                      Loading...
                    </td>
                  </tr>
                )}
                {!invoicesLoading && invoices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                      No invoices yet
                    </td>
                  </tr>
                )}
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-slate-800/50">
                    <td className="px-5 py-3 text-white font-mono text-xs">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-5 py-3 text-white">
                      {inv.currency} {inv.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-5 py-3 text-slate-400">{formatDate(inv.dueDate)}</td>
                    <td className="px-5 py-3">{invoiceStatusBadge(inv.status)}</td>
                    <td className="px-5 py-3">
                      {(inv.status === 'SENT' || inv.status === 'OVERDUE') && (
                        <button
                          onClick={() => openMarkPaid(inv)}
                          className="text-xs text-green-400 hover:text-green-300 transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Mark Paid Dialog */}
      {markPaidInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Mark Invoice as Paid
            </h3>
            <p className="text-sm text-slate-500 mb-5">
              Invoice {markPaidInvoice.invoiceNumber} — {markPaidInvoice.currency}{' '}
              {markPaidInvoice.totalAmount.toLocaleString()}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={paidForm.paymentDate}
                  onChange={(e) => setPaidField('paymentDate', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
                {paidErrors.paymentDate && (
                  <p className="text-red-500 text-xs mt-1">{paidErrors.paymentDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paidForm.paymentMethod}
                  onChange={(e) => setPaidField('paymentMethod', e.target.value)}
                  placeholder="Bank Transfer, UPI, etc."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
                {paidErrors.paymentMethod && (
                  <p className="text-red-500 text-xs mt-1">{paidErrors.paymentMethod}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={paidForm.amount}
                  onChange={(e) => setPaidField('amount', e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
                {paidErrors.amount && (
                  <p className="text-red-500 text-xs mt-1">{paidErrors.amount}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={paidForm.referenceNumber}
                  onChange={(e) => setPaidField('referenceNumber', e.target.value)}
                  placeholder="Optional"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={paidForm.notes}
                  onChange={(e) => setPaidField('notes', e.target.value)}
                  placeholder="Optional"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setMarkPaidInvoice(null)}
                className="text-sm text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (validatePaidForm()) markPaidMutation.mutate()
                }}
                disabled={markPaidMutation.isPending}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {markPaidMutation.isPending ? 'Saving...' : 'Mark as Paid'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
