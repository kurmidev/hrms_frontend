import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Settings2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { greenThanksApi } from '@/api/green-thanks.api'
import { usePermission } from '@/hooks/usePermission'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

const schema = z.object({
  inrPerPoint: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number().min(0, 'Must be 0 or more')
  ),
  quarterlyLimitPoints: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number().int().min(0, 'Must be 0 or more')
  ),
  isPayrollLinked: z.boolean(),
  effectiveFrom: z.string().min(1, 'Required'),
})
type FormValues = z.infer<typeof schema>

export function GreenThanksConfigPage() {
  const canManage = usePermission('payroll:run')
  const qc = useQueryClient()

  const { data: config, isLoading } = useQuery({
    queryKey: ['green-thanks-config'],
    queryFn: () => greenThanksApi.getConfig(),
    enabled: canManage,
  })

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    values: config
      ? {
          inrPerPoint: config.inrPerPoint,
          quarterlyLimitPoints: config.quarterlyLimitPoints,
          isPayrollLinked: config.isPayrollLinked,
          effectiveFrom: config.effectiveFrom.slice(0, 10),
        }
      : undefined,
  })

  const inrPerPoint = watch('inrPerPoint')
  const isPayrollLinked = watch('isPayrollLinked')

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormValues) => greenThanksApi.updateConfig(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['green-thanks-config'] })
      toast.success('Green Thanks configuration updated.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to update configuration.')),
  })

  if (!canManage) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-2">
        <ShieldAlert className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">You do not have permission to view this page.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Settings2 className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Green Thanks Configuration</h1>
          <p className="text-sm text-muted-foreground">Manage point conversion and quarterly limits</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Conversion & Limits</CardTitle>
          <CardDescription>Configure how points convert to payroll amounts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <form onSubmit={handleSubmit((v) => mutate(v))} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="inrPerPoint">INR per Point *</Label>
                  <Input id="inrPerPoint" type="number" step="0.01" min="0" {...register('inrPerPoint')} />
                  {errors.inrPerPoint && <p className="text-xs text-destructive">{errors.inrPerPoint.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="quarterlyLimitPoints">Quarterly Limit (points) *</Label>
                  <Input id="quarterlyLimitPoints" type="number" step="1" min="0" {...register('quarterlyLimitPoints')} />
                  {errors.quarterlyLimitPoints && (
                    <p className="text-xs text-destructive">{errors.quarterlyLimitPoints.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="effectiveFrom">Effective From *</Label>
                <Input id="effectiveFrom" type="date" {...register('effectiveFrom')} />
                {errors.effectiveFrom && <p className="text-xs text-destructive">{errors.effectiveFrom.message}</p>}
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="isPayrollLinked"
                  checked={isPayrollLinked ?? true}
                  onCheckedChange={(checked) => setValue('isPayrollLinked', checked === true)}
                />
                <Label htmlFor="isPayrollLinked" className="cursor-pointer">Link to payroll processing</Label>
              </div>

              {typeof inrPerPoint === 'number' && !Number.isNaN(inrPerPoint) && (
                <p className="text-sm text-muted-foreground bg-muted rounded-lg px-3 py-2">
                  10 points = ₹{(10 * inrPerPoint).toLocaleString()}
                </p>
              )}

              <div className="flex justify-end">
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Configuration
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
