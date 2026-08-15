import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Resolver } from 'react-hook-form'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { serviceRequestApi } from '@/api/service-request.api'
import type { ServiceRequestCategory, ServiceRequestPriority } from '@/types/service-request.types'
import { toast } from 'sonner'

const CATEGORIES: ServiceRequestCategory[] = ['HR', 'IT', 'ADMIN', 'COMPLIANCE', 'FINANCE', 'POLICY_CLARIFICATION']
const PRIORITIES: ServiceRequestPriority[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']

const schema = z.object({
  category: z.enum(['HR', 'IT', 'ADMIN', 'COMPLIANCE', 'FINANCE', 'POLICY_CLARIFICATION']),
  title: z.string().min(1, 'Required'),
  description: z.string().min(1, 'Required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  isAnonymous: z.boolean().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function RaiseServiceRequestDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient()

  // Anonymous submission is an org-level toggle (Organization.allowAnonymousServiceRequests) —
  // the checkbox must only render when the org actually allows it, otherwise the backend
  // rejects the create with a 400 the user has no way to anticipate. Uses the
  // service-requests-scoped settings endpoint (not /organization, which requires org:read —
  // a permission regular requesters don't hold).
  const { data: settings } = useQuery({
    queryKey: ['service-request-settings'],
    queryFn: serviceRequestApi.settings,
    staleTime: 5 * 60 * 1000,
  })
  const allowAnonymous = settings?.allowAnonymousServiceRequests ?? false

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { category: 'HR', priority: 'MEDIUM', isAnonymous: false },
  })

  const { mutate: create, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      serviceRequestApi.create({
        category: values.category,
        title: values.title,
        description: values.description,
        priority: values.priority,
        isAnonymous: values.isAnonymous,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['service-requests'] })
      onOpenChange(false)
      reset()
      toast.success('Request submitted.')
    },
    onError: () => toast.error('Failed to submit request.'),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) reset()
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Raise a Service Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => create(v))} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category *</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={(v) => field.onChange(v ?? '')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>{c.replace('_', ' ')}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Controller
                name="priority"
                control={control}
                render={({ field }) => (
                  <Select value={field.value ?? ''} onValueChange={(v) => field.onChange(v ?? '')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p} value={p}>{p}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" placeholder="Short summary" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description *</Label>
            <Textarea id="description" placeholder="Describe your request…" {...register('description')} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          {allowAnonymous && (
            <div className="flex items-center gap-2">
              <Controller
                name="isAnonymous"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="isAnonymous"
                    checked={!!field.value}
                    onCheckedChange={(v) => field.onChange(!!v)}
                  />
                )}
              />
              <Label htmlFor="isAnonymous" className="text-sm font-normal cursor-pointer">
                Submit anonymously
              </Label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Submit Request
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
