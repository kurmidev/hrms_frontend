import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Resolver } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { assetApi } from '@/api/asset.api'
import type { Asset, AssetStatus } from '@/types/asset.types'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

const RETURN_STATUSES: AssetStatus[] = ['AVAILABLE', 'UNDER_MAINTENANCE', 'DAMAGED']

const schema = z.object({
  conditionOnReturn: z.string().optional(),
  newStatus: z.string().optional(),
  notes: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: Asset | null
}

export function ReturnAssetDialog({ open, onOpenChange, asset }: Props) {
  const qc = useQueryClient()

  const { register, handleSubmit, reset, control } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { newStatus: 'AVAILABLE' },
  })

  const { mutate: doReturn, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      if (!asset) return Promise.reject(new Error('No asset selected'))
      return assetApi.return(asset.id, {
        conditionOnReturn: values.conditionOnReturn || undefined,
        newStatus: (values.newStatus as AssetStatus) || undefined,
        notes: values.notes || undefined,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] })
      qc.invalidateQueries({ queryKey: ['asset', asset?.id] })
      onOpenChange(false)
      reset()
      toast.success('Asset returned.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to return asset.')),
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
          <DialogTitle>Return Asset {asset ? `— ${asset.name}` : ''}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => doReturn(v))} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="conditionOnReturn">Condition on Return</Label>
            <Input id="conditionOnReturn" placeholder="e.g. Good / Damaged" {...register('conditionOnReturn')} />
          </div>
          <div className="space-y-1.5">
            <Label>New Status</Label>
            <Controller
              name="newStatus"
              control={control}
              render={({ field }) => (
                <Select
                  items={Object.fromEntries(RETURN_STATUSES.map((s) => [s, s.replace('_', ' ')]))}
                  value={field.value ?? ''}
                  onValueChange={(v) => field.onChange(v ?? '')}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RETURN_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>{s.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Input id="notes" {...register('notes')} />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Return
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
