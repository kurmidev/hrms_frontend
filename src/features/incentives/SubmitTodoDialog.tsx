import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { todosApi } from '@/api/incentives.api'
import type { TodoTask } from '@/types/incentives.types'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

const schema = z.object({
  quantity: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number().min(0, 'Quantity must be 0 or more').optional()
  ),
  unit: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  todo: TodoTask | null
}

export function SubmitTodoDialog({ open, onOpenChange, todo }: Props) {
  const qc = useQueryClient()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })

  const { mutate: submit, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      if (!todo) return Promise.reject(new Error('No todo selected'))
      return todosApi.submit(todo.id, {
        quantity: values.quantity,
        unit: values.unit || undefined,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['todos'] })
      onOpenChange(false)
      reset()
      toast.success('Todo submitted for review.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to submit todo.')),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="w-[92vw] sm:w-[85vw] max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit Todo</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => submit(v))} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="quantity">Completed Quantity</Label>
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0"
              placeholder={todo?.quantity != null ? String(todo.quantity) : ''}
              {...register('quantity')}
            />
            {errors.quantity && <p className="text-xs text-destructive">{errors.quantity.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="unit">Unit</Label>
            <Input id="unit" placeholder={todo?.unit ?? ''} {...register('unit')} />
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
