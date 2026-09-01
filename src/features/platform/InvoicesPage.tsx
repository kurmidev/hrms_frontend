import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { platformInvoicesApi } from '@/api/platform-invoices.api'
import { usePlatformAuthStore } from '@/store/platform-auth.store'
import { toast } from 'sonner'
import type { Invoice, InvoiceStatus } from '@/types/platform.types'
import { getApiErrorMessage } from '@/lib/utils'

const STATUS_OPTIONS: Array<InvoiceStatus | ''> = ['', 'DRAFT', 'SENT', 'PAID', 'OVERDUE', 'VOID']

function invoiceStatusBadge(status: InvoiceStatus) {
  const map: Record<InvoiceStatus, string> = {
    DRAFT: 'bg-[var(--platform-panel-bg)] text-[var(--platform-panel-muted)]',
    SENT: 'bg-[var(--platform-accent-tint)] text-[var(--platform-accent-hover)]',
    PAID: 'bg-green-100 text-green-700',
    OVERDUE: 'bg-red-100 text-red-700',
    VOID: 'bg-[var(--platform-panel-bg)] text-[var(--platform-panel-faint)]',
  }
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-[var(--platform-panel-bg)] text-[var(--platform-panel-muted)]'}`}
    >
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

export function InvoicesPage() {
  const queryClient = useQueryClient()
  const { admin } = usePlatformAuthStore()
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | ''>('')
  const [markPaidInvoice, setMarkPaidInvoice] = useState<Invoice | null>(null)
  const [paidForm, setPaidForm] = useState<MarkPaidForm>(INITIAL_PAID_FORM)
  const [paidErrors, setPaidErrors] = useState<Partial<Record<keyof MarkPaidForm, string>>>({})

  const { data, isLoading } = useQuery({
    queryKey: ['platform', 'invoices', statusFilter],
    queryFn: () =>
      platformInvoicesApi.list({
        status: statusFilter || undefined,
        page: 1,
        limit: 100,
      }),
  })

  const invoices = data?.items ?? []

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
      void queryClient.invalidateQueries({ queryKey: ['platform', 'invoices'] })
      setMarkPaidInvoice(null)
      setPaidForm(INITIAL_PAID_FORM)
      toast.success('Invoice marked as paid')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to mark as paid')),
  })

  const voidMutation = useMutation({
    mutationFn: (id: string) => platformInvoicesApi.void(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'invoices'] })
      toast.success('Invoice voided')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to void invoice')),
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Invoices</h1>
          <p className="text-[var(--platform-muted)] text-sm mt-1">{data?.total ?? 0} invoices</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as InvoiceStatus | '')}
          className="bg-[var(--platform-raised)] border border-[var(--platform-input-border)] text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-[var(--platform-accent)]"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === '' ? 'All Statuses' : s}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-[var(--platform-surface)] border border-[var(--platform-border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--platform-border)]">
                <th className="text-left px-5 py-3 text-[var(--platform-muted)] font-medium">Invoice #</th>
                <th className="text-left px-5 py-3 text-[var(--platform-muted)] font-medium">Organization</th>
                <th className="text-left px-5 py-3 text-[var(--platform-muted)] font-medium">Amount</th>
                <th className="text-left px-5 py-3 text-[var(--platform-muted)] font-medium">Due Date</th>
                <th className="text-left px-5 py-3 text-[var(--platform-muted)] font-medium">Status</th>
                <th className="text-left px-5 py-3 text-[var(--platform-muted)] font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[var(--platform-muted)]">
                    Loading...
                  </td>
                </tr>
              )}
              {!isLoading && invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-[var(--platform-muted)]">
                    No invoices found
                  </td>
                </tr>
              )}
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-[var(--platform-border)] hover:bg-[var(--platform-raised)]">
                  <td className="px-5 py-3 text-white font-mono text-xs">{inv.invoiceNumber}</td>
                  <td className="px-5 py-3 text-[var(--platform-text-soft)]">
                    {inv.organization?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-white">
                    {inv.currency} {inv.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-5 py-3 text-[var(--platform-muted)]">{formatDate(inv.dueDate)}</td>
                  <td className="px-5 py-3">{invoiceStatusBadge(inv.status)}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {(inv.status === 'SENT' || inv.status === 'OVERDUE') && (
                        <button
                          onClick={() => openMarkPaid(inv)}
                          className="text-xs text-green-400 hover:text-green-300 transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                      {inv.status !== 'PAID' && inv.status !== 'VOID' && (
                        <button
                          onClick={() => voidMutation.mutate(inv.id)}
                          disabled={voidMutation.isPending}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                        >
                          Void
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mark Paid Dialog */}
      {markPaidInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-[var(--platform-panel-heading)] mb-2">Mark Invoice as Paid</h3>
            <p className="text-sm text-[var(--platform-panel-muted)] mb-5">
              Invoice {markPaidInvoice.invoiceNumber} — {markPaidInvoice.currency}{' '}
              {markPaidInvoice.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--platform-panel-label)] mb-1">
                  Payment Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={paidForm.paymentDate}
                  onChange={(e) => setPaidField('paymentDate', e.target.value)}
                  className="w-full border border-[var(--platform-panel-border)] rounded-lg px-3 py-2 text-sm text-[var(--platform-panel-heading)] placeholder:text-[var(--platform-panel-faint)] focus:outline-none focus:border-[var(--platform-accent)]"
                />
                {paidErrors.paymentDate && (
                  <p className="text-red-500 text-xs mt-1">{paidErrors.paymentDate}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--platform-panel-label)] mb-1">
                  Payment Method <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={paidForm.paymentMethod}
                  onChange={(e) => setPaidField('paymentMethod', e.target.value)}
                  placeholder="Bank Transfer, UPI, etc."
                  className="w-full border border-[var(--platform-panel-border)] rounded-lg px-3 py-2 text-sm text-[var(--platform-panel-heading)] placeholder:text-[var(--platform-panel-faint)] focus:outline-none focus:border-[var(--platform-accent)]"
                />
                {paidErrors.paymentMethod && (
                  <p className="text-red-500 text-xs mt-1">{paidErrors.paymentMethod}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--platform-panel-label)] mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={paidForm.amount}
                  onChange={(e) => setPaidField('amount', e.target.value)}
                  className="w-full border border-[var(--platform-panel-border)] rounded-lg px-3 py-2 text-sm text-[var(--platform-panel-heading)] placeholder:text-[var(--platform-panel-faint)] focus:outline-none focus:border-[var(--platform-accent)]"
                />
                {paidErrors.amount && (
                  <p className="text-red-500 text-xs mt-1">{paidErrors.amount}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--platform-panel-label)] mb-1">
                  Reference Number
                </label>
                <input
                  type="text"
                  value={paidForm.referenceNumber}
                  onChange={(e) => setPaidField('referenceNumber', e.target.value)}
                  placeholder="Optional"
                  className="w-full border border-[var(--platform-panel-border)] rounded-lg px-3 py-2 text-sm text-[var(--platform-panel-heading)] placeholder:text-[var(--platform-panel-faint)] focus:outline-none focus:border-[var(--platform-accent)]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--platform-panel-label)] mb-1">Notes</label>
                <input
                  type="text"
                  value={paidForm.notes}
                  onChange={(e) => setPaidField('notes', e.target.value)}
                  placeholder="Optional"
                  className="w-full border border-[var(--platform-panel-border)] rounded-lg px-3 py-2 text-sm text-[var(--platform-panel-heading)] placeholder:text-[var(--platform-panel-faint)] focus:outline-none focus:border-[var(--platform-accent)]"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setMarkPaidInvoice(null)}
                className="text-sm text-[var(--platform-panel-muted)] hover:text-[var(--platform-panel-heading)]"
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
