import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { serviceRequestApi } from '@/api/service-request.api'
import type { ServiceRequest } from '@/types/service-request.types'
import { toast } from 'sonner'

const schema = z.object({
  resolutionNote: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  request: ServiceRequest | null
}

export function ResolveRequestDialog({ open, onOpenChange, request }: Props) {
  const qc = useQueryClient()

  const { register, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })

  const { mutate: resolve, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      if (!request) return Promise.reject(new Error('No request selected'))
      return serviceRequestApi.resolve(request.id, { resolutionNote: values.resolutionNote || undefined })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-requests'] })
      qc.invalidateQueries({ queryKey: ['service-request', request?.id] })
      onOpenChange(false)
      reset()
      toast.success('Request resolved.')
    },
    onError: () => toast.error('Failed to resolve request.'),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Resolve Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => resolve(v))} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="resolutionNote">Resolution Note</Label>
            <Textarea id="resolutionNote" placeholder="How was this resolved?" {...register('resolutionNote')} />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Resolve
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
