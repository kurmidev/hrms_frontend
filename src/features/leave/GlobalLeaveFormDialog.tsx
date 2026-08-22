import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Resolver } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { globalLeaveApi } from '@/api/global-leave.api'
import { zonesApi } from '@/api/zones.api'
import type { Zone } from '@/types/zone.types'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  date: z.string().min(1, 'Date is required'),
  appliesToAll: z.boolean().optional(),
  zoneIds: z.array(z.string()).optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GlobalLeaveFormDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient()

  const { data: zonesData } = useQuery({
    queryKey: ['zones', { forSelect: true }],
    queryFn: () => zonesApi.list({ limit: 100, isActive: true }),
    enabled: open,
  })
  const zones = (zonesData as { data?: Zone[] })?.data ?? []

  const { register, handleSubmit, reset, control, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { name: '', date: '', appliesToAll: false, zoneIds: [] },
  })
  const appliesToAll = watch('appliesToAll')

  const { mutate: create, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      globalLeaveApi.create({
        name: values.name,
        date: values.date,
        appliesToAll: values.appliesToAll,
        zoneIds: values.appliesToAll ? undefined : values.zoneIds,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['global-leaves'] })
      onOpenChange(false)
      reset()
      toast.success('Global leave created.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to create global leave.')),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="w-[92vw] sm:w-[85vw] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Global Leave</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => create(v))} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="gl-name">Name *</Label>
            <Input id="gl-name" placeholder="e.g. Founders' Day" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="gl-date">Date *</Label>
            <Input id="gl-date" type="date" {...register('date')} />
            {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
            <div>
              <Label htmlFor="gl-applies-all" className="text-sm font-medium">Applies to all employees</Label>
              <p className="text-xs text-muted-foreground">Skip zone targeting and mark this a company-wide leave day</p>
            </div>
            <Controller
              name="appliesToAll"
              control={control}
              render={({ field }) => (
                <Switch id="gl-applies-all" checked={!!field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
          {!appliesToAll && (
            <div className="space-y-1.5">
              <Label>Zones</Label>
              <div className="max-h-40 overflow-y-auto rounded-lg border border-border p-2 space-y-1">
                {zones.length === 0 && (
                  <p className="text-xs text-muted-foreground px-1 py-2">No active zones. Create one under Organization &rsaquo; Zones.</p>
                )}
                <Controller
                  name="zoneIds"
                  control={control}
                  render={({ field }) => (
                    <>
                      {zones.map((z) => {
                        const checked = (field.value ?? []).includes(z.id)
                        return (
                          <label key={z.id} className="flex items-center gap-2 px-1 py-1 text-sm cursor-pointer">
                            <Checkbox
                              checked={checked}
                              onCheckedChange={(v) => {
                                const current = field.value ?? []
                                field.onChange(v ? [...current, z.id] : current.filter((id) => id !== z.id))
                              }}
                            />
                            {z.name}
                          </label>
                        )
                      })}
                    </>
                  )}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
