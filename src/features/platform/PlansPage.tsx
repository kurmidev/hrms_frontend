import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { platformPlansApi } from '@/api/platform-plans.api'
import { toast } from 'sonner'
import { Check, Plus, Pencil } from 'lucide-react'
import type { SubscriptionPlan } from '@/types/platform.types'
import { getApiErrorMessage } from '@/lib/utils'

interface PlanForm {
  name: string
  description: string
  maxEmployees: number
  priceMonthly: number
  priceQuarterly: number
  priceYearly: number
  features: string
  isActive: boolean
  sortOrder: number
}

const INITIAL_FORM: PlanForm = {
  name: '',
  description: '',
  maxEmployees: 50,
  priceMonthly: 0,
  priceQuarterly: 0,
  priceYearly: 0,
  features: '',
  isActive: true,
  sortOrder: 0,
}

function planToForm(plan: SubscriptionPlan): PlanForm {
  return {
    name: plan.name,
    description: plan.description ?? '',
    maxEmployees: plan.maxEmployees,
    priceMonthly: plan.priceMonthly,
    priceQuarterly: plan.priceQuarterly,
    priceYearly: plan.priceYearly,
    features: plan.features.join(', '),
    isActive: plan.isActive,
    sortOrder: plan.sortOrder,
  }
}

export function PlansPage() {
  const queryClient = useQueryClient()
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState<PlanForm>(INITIAL_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof PlanForm, string>>>({})

  const { data: plans = [], isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['platform', 'plans'],
    queryFn: () => platformPlansApi.list(),
  })

  const createMutation = useMutation({
    mutationFn: () =>
      platformPlansApi.create({
        name: form.name,
        description: form.description || null,
        maxEmployees: form.maxEmployees,
        priceMonthly: form.priceMonthly,
        priceQuarterly: form.priceQuarterly,
        priceYearly: form.priceYearly,
        features: form.features
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean),
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'plans'] })
      setShowCreate(false)
      setForm(INITIAL_FORM)
      toast.success('Plan created')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to create plan')),
  })

  const updateMutation = useMutation({
    mutationFn: (id: string) =>
      platformPlansApi.update(id, {
        name: form.name,
        description: form.description || null,
        maxEmployees: form.maxEmployees,
        priceMonthly: form.priceMonthly,
        priceQuarterly: form.priceQuarterly,
        priceYearly: form.priceYearly,
        features: form.features
          .split(',')
          .map((f) => f.trim())
          .filter(Boolean),
        isActive: form.isActive,
        sortOrder: form.sortOrder,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['platform', 'plans'] })
      setEditingPlan(null)
      toast.success('Plan updated')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to update plan')),
  })

  function setField<K extends keyof PlanForm>(key: K, value: PlanForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate() {
    const errs: Partial<Record<keyof PlanForm, string>> = {}
    if (!form.name.trim()) errs.name = 'Required'
    if (form.maxEmployees <= 0) errs.maxEmployees = 'Must be > 0'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function openCreate() {
    setForm(INITIAL_FORM)
    setErrors({})
    setShowCreate(true)
  }

  function openEdit(plan: SubscriptionPlan) {
    setForm(planToForm(plan))
    setErrors({})
    setEditingPlan(plan)
  }

  const isModalOpen = showCreate || !!editingPlan

  function handleSave() {
    if (!validate()) return
    if (editingPlan) {
      updateMutation.mutate(editingPlan.id)
    } else {
      createMutation.mutate()
    }
  }

  function closeModal() {
    setShowCreate(false)
    setEditingPlan(null)
    setErrors({})
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Subscription Plans</h1>
          <p className="text-[var(--platform-muted)] text-sm mt-1">{plans.length} plans configured</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[var(--platform-accent)] hover:bg-[var(--platform-accent-hover)] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Create Plan
        </button>
      </div>

      {isLoading && (
        <div className="text-center py-12 text-[var(--platform-muted)]">Loading plans...</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`bg-[var(--platform-surface)] border rounded-xl p-5 space-y-4 ${plan.isActive ? 'border-[var(--platform-border)]' : 'border-[var(--platform-border)] opacity-60'}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-white text-base">{plan.name}</h3>
                {plan.description && (
                  <p className="text-[var(--platform-muted)] text-xs mt-1">{plan.description}</p>
                )}
                <p className="text-xs text-[var(--platform-muted)] mt-1">Up to {plan.maxEmployees} employees</p>
                {!plan.isActive && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-[var(--platform-raised)] text-[var(--platform-muted)] text-xs rounded-full">
                    Inactive
                  </span>
                )}
              </div>
              <button
                onClick={() => openEdit(plan)}
                className="text-[var(--platform-muted)] hover:text-white transition-colors p-1"
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-[var(--platform-raised)] rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[var(--platform-muted)]">Monthly</span>
                <span className="text-white font-medium">₹{plan.priceMonthly.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--platform-muted)]">Quarterly</span>
                <span className="text-white font-medium">₹{plan.priceQuarterly.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--platform-muted)]">Yearly</span>
                <span className="text-white font-medium">₹{plan.priceYearly.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            {plan.features.length > 0 && (
              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-[var(--platform-text-soft)]">
                    <Check className="h-3 w-3 text-green-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      {/* Plan Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <h3 className="text-lg font-bold text-[var(--platform-panel-heading)] mb-5">
              {editingPlan ? 'Edit Plan' : 'Create Plan'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--platform-panel-label)] mb-1">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className="w-full border border-[var(--platform-panel-border)] rounded-lg px-3 py-2 text-sm text-[var(--platform-panel-heading)] placeholder:text-[var(--platform-panel-faint)] focus:outline-none focus:border-[var(--platform-accent)]"
                  placeholder="Starter"
                />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--platform-panel-label)] mb-1">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  rows={2}
                  className="w-full border border-[var(--platform-panel-border)] rounded-lg px-3 py-2 text-sm text-[var(--platform-panel-heading)] placeholder:text-[var(--platform-panel-faint)] focus:outline-none focus:border-[var(--platform-accent)] resize-none"
                  placeholder="Ideal for small teams"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--platform-panel-label)] mb-1">
                  Max Employees <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.maxEmployees}
                  onChange={(e) => setField('maxEmployees', Number(e.target.value))}
                  className="w-full border border-[var(--platform-panel-border)] rounded-lg px-3 py-2 text-sm text-[var(--platform-panel-heading)] placeholder:text-[var(--platform-panel-faint)] focus:outline-none focus:border-[var(--platform-accent)]"
                />
                {errors.maxEmployees && (
                  <p className="text-red-500 text-xs mt-1">{errors.maxEmployees}</p>
                )}
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--platform-panel-label)] mb-1">Monthly ₹</label>
                  <input
                    type="number"
                    min={0}
                    value={form.priceMonthly}
                    onChange={(e) => setField('priceMonthly', Number(e.target.value))}
                    className="w-full border border-[var(--platform-panel-border)] rounded-lg px-3 py-2 text-sm text-[var(--platform-panel-heading)] placeholder:text-[var(--platform-panel-faint)] focus:outline-none focus:border-[var(--platform-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--platform-panel-label)] mb-1">
                    Quarterly ₹
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={form.priceQuarterly}
                    onChange={(e) => setField('priceQuarterly', Number(e.target.value))}
                    className="w-full border border-[var(--platform-panel-border)] rounded-lg px-3 py-2 text-sm text-[var(--platform-panel-heading)] placeholder:text-[var(--platform-panel-faint)] focus:outline-none focus:border-[var(--platform-accent)]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--platform-panel-label)] mb-1">Yearly ₹</label>
                  <input
                    type="number"
                    min={0}
                    value={form.priceYearly}
                    onChange={(e) => setField('priceYearly', Number(e.target.value))}
                    className="w-full border border-[var(--platform-panel-border)] rounded-lg px-3 py-2 text-sm text-[var(--platform-panel-heading)] placeholder:text-[var(--platform-panel-faint)] focus:outline-none focus:border-[var(--platform-accent)]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--platform-panel-label)] mb-1">
                  Features (comma-separated)
                </label>
                <input
                  type="text"
                  value={form.features}
                  onChange={(e) => setField('features', e.target.value)}
                  className="w-full border border-[var(--platform-panel-border)] rounded-lg px-3 py-2 text-sm text-[var(--platform-panel-heading)] placeholder:text-[var(--platform-panel-faint)] focus:outline-none focus:border-[var(--platform-accent)]"
                  placeholder="Payroll, Leave Management, Attendance"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--platform-panel-label)] mb-1">Sort Order</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setField('sortOrder', Number(e.target.value))}
                  className="w-full border border-[var(--platform-panel-border)] rounded-lg px-3 py-2 text-sm text-[var(--platform-panel-heading)] placeholder:text-[var(--platform-panel-faint)] focus:outline-none focus:border-[var(--platform-accent)]"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={form.isActive}
                  onChange={(e) => setField('isActive', e.target.checked)}
                  className="w-4 h-4 rounded border-[var(--platform-panel-border)] text-[var(--platform-accent)] focus:ring-[var(--platform-accent)]"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-[var(--platform-panel-label)]">
                  Active
                </label>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={closeModal}
                className="text-sm text-[var(--platform-panel-muted)] hover:text-[var(--platform-panel-heading)]"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-[var(--platform-accent)] hover:bg-[var(--platform-accent-hover)] disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {isSaving ? 'Saving...' : editingPlan ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
