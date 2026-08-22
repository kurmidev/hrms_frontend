import { useEffect } from 'react'
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
import type { Asset, AssetType } from '@/types/asset.types'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

const ASSET_TYPES: AssetType[] = ['LAPTOP', 'ID_CARD', 'SIM', 'VEHICLE', 'OTHER']

const schema = z.object({
  type: z.string().min(1, 'Required'),
  name: z.string().min(1, 'Required'),
  serialNumber: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseValue: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number().min(0).optional()
  ),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  asset: Asset | null
}

export function AssetFormDialog({ open, onOpenChange, asset }: Props) {
  const qc = useQueryClient()

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { type: 'LAPTOP' },
  })

  useEffect(() => {
    if (open) {
      reset(
        asset
          ? {
              type: asset.type,
              name: asset.name,
              serialNumber: asset.serialNumber ?? '',
              purchaseDate: asset.purchaseDate ? asset.purchaseDate.slice(0, 10) : '',
              purchaseValue: asset.purchaseValue ?? undefined,
            }
          : { type: 'LAPTOP', name: '', serialNumber: '', purchaseDate: '', purchaseValue: undefined }
      )
    }
  }, [open, asset, reset])

  const { mutate: save, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        type: values.type,
        name: values.name,
        serialNumber: values.serialNumber || undefined,
        purchaseDate: values.purchaseDate || undefined,
        purchaseValue: values.purchaseValue,
      }
      return asset ? assetApi.update(asset.id, payload) : assetApi.create(payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['assets'] })
      if (asset) qc.invalidateQueries({ queryKey: ['asset', asset.id] })
      onOpenChange(false)
      toast.success(asset ? 'Asset updated.' : 'Asset created.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, asset ? 'Failed to update asset.' : 'Failed to create asset.')),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:w-[85vw] lg:w-[70vw] max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{asset ? 'Edit Asset' : 'New Asset'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save(v))} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Type *</Label>
            <Controller
              name="type"
              control={control}
              render={({ field }) => (
                <Select
                  items={Object.fromEntries(ASSET_TYPES.map((t) => [t, t.replace('_', ' ')]))}
                  value={field.value}
                  onValueChange={(v) => field.onChange(v ?? '')}
                >
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSET_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t.replace('_', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" placeholder="e.g. MacBook Pro 14&quot;" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="serialNumber">Serial Number</Label>
            <Input id="serialNumber" {...register('serialNumber')} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="purchaseDate">Purchase Date</Label>
              <Input id="purchaseDate" type="date" {...register('purchaseDate')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="purchaseValue">Purchase Value</Label>
              <Input id="purchaseValue" type="number" step="0.01" min="0" {...register('purchaseValue')} />
              {errors.purchaseValue && <p className="text-xs text-destructive">{errors.purchaseValue.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {asset ? 'Save Changes' : 'Create Asset'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
