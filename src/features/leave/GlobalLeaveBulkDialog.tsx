import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Resolver } from 'react-hook-form'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { globalLeaveApi } from '@/api/global-leave.api'
import { zonesApi } from '@/api/zones.api'
import type { Zone } from '@/types/zone.types'
import type { BulkGlobalLeaveResult } from '@/types/global-leave.types'
import { toast } from 'sonner'
import { cn, getApiErrorMessage } from '@/lib/utils'
import { useState } from 'react'

const rowSchema = z.object({
  name: z.string().min(1, 'Required'),
  date: z.string().min(1, 'Required'),
  appliesToAll: z.boolean().optional(),
  zoneIds: z.array(z.string()).optional(),
})
const schema = z.object({ items: z.array(rowSchema).min(1, 'Add at least one row') })
type FormValues = z.infer<typeof schema>

const EMPTY_ROW = { name: '', date: '', appliesToAll: false, zoneIds: [] as string[] }

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalLeaveBulkDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient()
  const [result, setResult] = useState<BulkGlobalLeaveResult | null>(null)

  const { data: zonesData } = useQuery({
    queryKey: ['zones', { forSelect: true }],
    queryFn: () => zonesApi.list({ limit: 100, isActive: true }),
    enabled: open,
  })
  const zones = (zonesData as { data?: Zone[] })?.data ?? []

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { items: [EMPTY_ROW] },
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const items = watch('items')

  const { mutate: bulkCreate, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      globalLeaveApi.bulkCreate({
        items: values.items.map((row) => ({
          name: row.name,
          date: row.date,
          appliesToAll: row.appliesToAll,
          zoneIds: row.appliesToAll ? undefined : row.zoneIds,
        })),
      }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['global-leaves'] })
      setResult(res)
      if (res.errorCount === 0) {
        toast.success(`${res.createdCount} global leave day(s) created.`)
      } else {
        toast.warning(`${res.createdCount} created, ${res.errorCount} failed. See details below.`)
      }
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Bulk upload failed.')),
  })

  const close = () => {
    onOpenChange(false)
    reset({ items: [EMPTY_ROW] })
    setResult(null)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="w-[92vw] sm:w-[85vw] lg:w-[70vw] max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Bulk Upload Global Leave Days</DialogTitle>
        </DialogHeader>

        {result && (
          <div className="rounded-lg border border-border bg-muted/40 p-3 space-y-2">
            <p className="text-sm font-medium text-foreground">
              {result.createdCount} created, {result.errorCount} failed
            </p>
            {result.errors.length > 0 && (
              <ul className="max-h-32 overflow-y-auto text-xs text-destructive space-y-1">
                {result.errors.map((e) => (
                  <li key={e.index}>
                    Row {e.index + 1} ({e.name || 'unnamed'}): {e.error}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit((v) => bulkCreate(v))} className="space-y-4 py-2">
          <div className="space-y-3">
            {fields.map((field, index) => {
              const rowAppliesToAll = items?.[index]?.appliesToAll
              return (
                <div key={field.id} className="rounded-lg border border-border p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Row {index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      disabled={fields.length === 1}
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor={`items.${index}.name`}>Name *</Label>
                      <Input id={`items.${index}.name`} placeholder="e.g. Founders' Day" {...register(`items.${index}.name` as const)} />
                      {errors.items?.[index]?.name && (
                        <p className="text-xs text-destructive">{errors.items[index]?.name?.message}</p>
                      )}
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`items.${index}.date`}>Date *</Label>
                      <Input id={`items.${index}.date`} type="date" {...register(`items.${index}.date` as const)} />
                      {errors.items?.[index]?.date && (
                        <p className="text-xs text-destructive">{errors.items[index]?.date?.message}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Controller
                      name={`items.${index}.appliesToAll`}
                      control={control}
                      render={({ field: f }) => (
                        <Switch id={`items.${index}.appliesToAll`} checked={!!f.value} onCheckedChange={f.onChange} size="sm" />
                      )}
                    />
                    <Label htmlFor={`items.${index}.appliesToAll`} className="text-sm font-normal cursor-pointer">
                      Applies to all employees
                    </Label>
                  </div>
                  {!rowAppliesToAll && (
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Zones</Label>
                      <Controller
                        name={`items.${index}.zoneIds`}
                        control={control}
                        render={({ field: f }) => (
                          <div className="flex flex-wrap gap-1.5">
                            {zones.length === 0 && (
                              <span className="text-xs text-muted-foreground">No active zones defined.</span>
                            )}
                            {zones.map((z) => {
                              const selected = (f.value ?? []).includes(z.id)
                              return (
                                <button
                                  type="button"
                                  key={z.id}
                                  onClick={() => {
                                    const current = f.value ?? []
                                    f.onChange(selected ? current.filter((id) => id !== z.id) : [...current, z.id])
                                  }}
                                >
                                  <Badge
                                    variant="secondary"
                                    className={cn(
                                      'cursor-pointer border-0 text-xs font-medium',
                                      selected ? 'bg-primary text-primary-foreground' : 'bg-slate-100 text-slate-600'
                                    )}
                                  >
                                    {z.name}
                                  </Badge>
                                </button>
                              )
                            })}
                          </div>
                        )}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => append(EMPTY_ROW)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Row
          </Button>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={close}>Close</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Upload {items?.length ?? 0} Row{(items?.length ?? 0) === 1 ? '' : 's'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
