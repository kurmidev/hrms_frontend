import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { platformOrgsApi } from '@/api/platform-organizations.api'
import { platformPlansApi } from '@/api/platform-plans.api'
import { toast } from 'sonner'
import { Link } from 'react-router-dom'
import { Check, Copy, Plus, ExternalLink } from 'lucide-react'
import type { PlatformOrg, SubscriptionPlan } from '@/types/platform.types'

type SubscriptionStatusType = 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED'

function statusBadge(status: SubscriptionStatusType | undefined) {
  if (!status) return <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500">—</span>
  const map: Record<SubscriptionStatusType, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    PAST_DUE: 'bg-yellow-100 text-yellow-700',
    SUSPENDED: 'bg-red-100 text-red-700',
    CANCELLED: 'bg-slate-100 text-slate-500',
  }
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[status] ?? 'bg-slate-100 text-slate-500'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  )
}

interface RegisterFormData {
  name: string
  email: string
  phone: string
  address: string
  planId: string
  billingCycle: string
  gracePeriodDays: number
  taxPercent: number
  dueAfterDays: number
  adminEmail: string
  adminName: string
}

const INITIAL_FORM: RegisterFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  planId: '',
  billingCycle: 'MONTHLY',
  gracePeriodDays: 7,
  taxPercent: 18,
  dueAfterDays: 30,
  adminEmail: '',
  adminName: '',
}

interface SuccessResult {
  tempPassword: string
  orgName: string
}

export function OrganizationsListPage() {
  const queryClient = useQueryClient()
  const [showRegister, setShowRegister] = useState(false)
  const [step, setStep] = useState(1)
  const [form, setForm] = useState<RegisterFormData>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof RegisterFormData, string>>>({})
  const [successResult, setSuccessResult] = useState<SuccessResult | null>(null)
  const [copied, setCopied] = useState(false)

  const { data: orgsData, isLoading } = useQuery({
    queryKey: ['platform', 'orgs'],
    queryFn: () => platformOrgsApi.list({ page: 1, limit: 100 }),
  })
  const { data: plans = [] } = useQuery<SubscriptionPlan[]>({
    queryKey: ['platform', 'plans'],
    queryFn: () => platformPlansApi.list(),
  })

  const suspendMutation = useMutation({
    mutationFn: (id: string) => platformOrgsApi.suspend(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'orgs'] })
      toast.success('Organization suspended')
    },
    onError: () => toast.error('Failed to suspend organization'),
  })

  const activateMutation = useMutation({
    mutationFn: (id: string) => platformOrgsApi.activate(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'orgs'] })
      toast.success('Organization activated')
    },
    onError: () => toast.error('Failed to activate organization'),
  })

  const registerMutation = useMutation({
    mutationFn: () =>
      platformOrgsApi.register({
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        address: form.address || undefined,
        planId: form.planId,
        billingCycle: form.billingCycle,
        gracePeriodDays: form.gracePeriodDays,
        taxPercent: form.taxPercent,
        dueAfterDays: form.dueAfterDays,
        adminEmail: form.adminEmail,
        adminName: form.adminName || undefined,
      }),
    onSuccess: (data) => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'orgs'] })
      setShowRegister(false)
      setStep(1)
      setForm(INITIAL_FORM)
      setSuccessResult({ tempPassword: data.tempPassword, orgName: data.organization.name })
    },
    onError: () => toast.error('Failed to register organization'),
  })

  function setField<K extends keyof RegisterFormData>(key: K, value: RegisterFormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validateStep1() {
    const errs: Partial<Record<keyof RegisterFormData, string>> = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (!form.email.trim()) errs.email = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Invalid email'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateStep2() {
    const errs: Partial<Record<keyof RegisterFormData, string>> = {}
    if (!form.planId) errs.planId = 'Select a plan'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function validateStep4() {
    const errs: Partial<Record<keyof RegisterFormData, string>> = {}
    if (!form.adminEmail.trim()) errs.adminEmail = 'Required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail))
      errs.adminEmail = 'Invalid email'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleNext() {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setStep((s) => s + 1)
  }

  function handleSubmit() {
    if (!validateStep4()) return
    registerMutation.mutate()
  }

  function openRegister() {
    setShowRegister(true)
    setStep(1)
    setForm(INITIAL_FORM)
    setErrors({})
  }

  function closeRegister() {
    setShowRegister(false)
    setStep(1)
    setForm(INITIAL_FORM)
    setErrors({})
  }

  async function copyPassword() {
    if (!successResult) return
    await navigator.clipboard.writeText(successResult.tempPassword)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const orgs: PlatformOrg[] = orgsData?.data ?? []

  const selectedPlan = plans.find((p) => p.id === form.planId)

  const stepLabels = ['Company Info', 'Plan', 'Billing', 'Admin & Review']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Organizations</h1>
          <p className="text-slate-400 text-sm mt-1">{orgsData?.meta.total ?? 0} registered companies</p>
        </div>
        <button
          onClick={openRegister}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Register Company
        </button>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800">
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Name</th>
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Email</th>
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Plan</th>
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Billing</th>
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Status</th>
                <th className="text-left px-5 py-3 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    Loading...
                  </td>
                </tr>
              )}
              {!isLoading && orgs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-slate-500">
                    No organizations yet
                  </td>
                </tr>
              )}
              {orgs.map((org) => (
                <tr key={org.id} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                  <td className="px-5 py-3 text-white font-medium">{org.name}</td>
                  <td className="px-5 py-3 text-slate-400">{org.email ?? '—'}</td>
                  <td className="px-5 py-3 text-slate-400">
                    {org.subscription?.plan?.name ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-slate-400">
                    {org.subscription?.billingCycle ?? '—'}
                  </td>
                  <td className="px-5 py-3">
                    {statusBadge(org.subscription?.status as SubscriptionStatusType | undefined)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/platform/organizations/${org.id}`}
                        className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View
                      </Link>
                      {org.subscription?.status === 'SUSPENDED' ? (
                        <button
                          onClick={() => activateMutation.mutate(org.id)}
                          disabled={activateMutation.isPending}
                          className="text-xs text-green-400 hover:text-green-300 transition-colors disabled:opacity-50"
                        >
                          Activate
                        </button>
                      ) : (
                        <button
                          onClick={() => suspendMutation.mutate(org.id)}
                          disabled={suspendMutation.isPending}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
                        >
                          Suspend
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

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto text-slate-900">
            <div className="px-6 py-5 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900">Register Company</h2>
              {/* Step tracker */}
              <div className="flex items-center gap-0 mt-4">
                {stepLabels.map((label, i) => {
                  const n = i + 1
                  const active = step === n
                  const done = step > n
                  return (
                    <div key={label} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${done ? 'bg-blue-600 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}
                        >
                          {done ? <Check className="h-3.5 w-3.5" /> : n}
                        </div>
                        <span
                          className={`text-[10px] mt-1 font-medium whitespace-nowrap ${active ? 'text-blue-600' : 'text-slate-400'}`}
                        >
                          {label}
                        </span>
                      </div>
                      {i < stepLabels.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 mx-1 mb-4 ${done ? 'bg-blue-600' : 'bg-slate-200'}`}
                        />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Step 1: Company Info */}
              {step === 1 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setField('name', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                      placeholder="Acme Corp"
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setField('email', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                      placeholder="contact@acme.com"
                    />
                    {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                    <input
                      type="tel"
                      value={form.phone}
                      maxLength={10}
                      onChange={(e) => setField('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                      placeholder="10-digit mobile number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
                    <textarea
                      rows={3}
                      value={form.address}
                      onChange={(e) => setField('address', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 resize-none"
                      placeholder="Full address"
                    />
                  </div>
                </>
              )}

              {/* Step 2: Plan */}
              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700">Select a plan</p>
                  {errors.planId && <p className="text-red-500 text-xs">{errors.planId}</p>}
                  {plans.filter((p) => p.isActive).map((plan) => (
                    <label
                      key={plan.id}
                      className={`block border-2 rounded-xl p-4 cursor-pointer transition-colors ${form.planId === plan.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        value={plan.id}
                        checked={form.planId === plan.id}
                        onChange={() => setField('planId', plan.id)}
                        className="sr-only"
                      />
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{plan.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Up to {plan.maxEmployees} employees
                          </p>
                          {plan.features.length > 0 && (
                            <ul className="mt-2 space-y-0.5">
                              {plan.features.slice(0, 4).map((f) => (
                                <li key={f} className="text-xs text-slate-600 flex items-center gap-1">
                                  <Check className="h-3 w-3 text-green-500 flex-shrink-0" />
                                  {f}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div className="text-right text-xs text-slate-500 space-y-0.5 flex-shrink-0 ml-3">
                          <p>Monthly: <span className="font-medium text-slate-800">₹{plan.priceMonthly.toLocaleString('en-IN')}</span></p>
                          <p>Quarterly: <span className="font-medium text-slate-800">₹{plan.priceQuarterly.toLocaleString('en-IN')}</span></p>
                          <p>Yearly: <span className="font-medium text-slate-800">₹{plan.priceYearly.toLocaleString('en-IN')}</span></p>
                        </div>
                      </div>
                    </label>
                  ))}
                  {plans.filter((p) => p.isActive).length === 0 && (
                    <p className="text-sm text-slate-500 text-center py-4">No active plans available</p>
                  )}
                </div>
              )}

              {/* Step 3: Billing */}
              {step === 3 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Billing Cycle
                    </label>
                    <select
                      value={form.billingCycle}
                      onChange={(e) => setField('billingCycle', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="QUARTERLY">Quarterly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Grace Period Days
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.gracePeriodDays}
                      onChange={(e) => setField('gracePeriodDays', Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tax Percent (%)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form.taxPercent}
                      onChange={(e) => setField('taxPercent', Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Due After Days
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.dueAfterDays}
                      onChange={(e) => setField('dueAfterDays', Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </>
              )}

              {/* Step 4: Admin & Review */}
              {step === 4 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Admin Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.adminEmail}
                      onChange={(e) => setField('adminEmail', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                      placeholder="admin@company.com"
                    />
                    {errors.adminEmail && (
                      <p className="text-red-500 text-xs mt-1">{errors.adminEmail}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Admin Name
                    </label>
                    <input
                      type="text"
                      value={form.adminName}
                      onChange={(e) => setField('adminName', e.target.value)}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                      placeholder="John Doe"
                    />
                  </div>

                  {/* Summary */}
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2 text-sm">
                    <p className="font-semibold text-slate-700 mb-2">Summary</p>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Company</span>
                      <span className="text-slate-800 font-medium">{form.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email</span>
                      <span className="text-slate-800">{form.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Plan</span>
                      <span className="text-slate-800">{selectedPlan?.name ?? '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Billing</span>
                      <span className="text-slate-800">{form.billingCycle}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Tax</span>
                      <span className="text-slate-800">{form.taxPercent}%</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={step === 1 ? closeRegister : () => setStep((s) => s - 1)}
                className="text-sm text-slate-600 hover:text-slate-800 transition-colors"
              >
                {step === 1 ? 'Cancel' : 'Back'}
              </button>
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={registerMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {registerMutation.isPending ? 'Registering...' : 'Register'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Success Dialog */}
      {successResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex flex-col items-center gap-3 mb-5">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-bold text-slate-900">Organization Registered</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {successResult.orgName} has been successfully created.
                </p>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-2 font-medium">Temporary Admin Password</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-sm font-mono text-slate-800 bg-white border border-slate-200 rounded-lg px-3 py-2 break-all">
                  {successResult.tempPassword}
                </code>
                <button
                  onClick={copyPassword}
                  className="flex-shrink-0 p-2 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <button
              onClick={() => setSuccessResult(null)}
              className="mt-4 w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
