import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Paperclip } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { noticesApi } from '@/api/notices.api'
import { rolesApi } from '@/api/roles.api'
import { departmentsApi } from '@/api/departments.api'
import type { Notice, NoticeTargetType } from '@/types/notices.types'
import type { Role, Department } from '@/types/organization.types'
import { toast } from 'sonner'

const schema = z.object({
  title: z.string().min(1, 'Required'),
  body: z.string().min(1, 'Required'),
  targetType: z.enum(['ALL', 'TARGETED']),
  scheduledAt: z.string().optional(),
  expiresAt: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  notice: Notice | null
}

export function NoticeFormDialog({ open, onOpenChange, notice }: Props) {
  const qc = useQueryClient()
  const isEdit = !!notice
  const [targetRoles, setTargetRoles] = useState<string[]>([])
  const [targetDepts, setTargetDepts] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)

  const { data: rolesData } = useQuery({
    queryKey: ['roles', { forSelect: true }],
    queryFn: () => rolesApi.list(),
    enabled: open,
  })
  const roles = (rolesData as Role[]) ?? []

  const { data: deptsData } = useQuery({
    queryKey: ['departments', { forSelect: true }],
    queryFn: () => departmentsApi.list({ limit: 100 }),
    enabled: open,
  })
  const departments = (deptsData as { data?: Department[] })?.data ?? []

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { targetType: 'ALL' },
  })
  const targetType = watch('targetType')

  useEffect(() => {
    if (!open) return
    if (notice) {
      reset({
        title: notice.title,
        body: notice.body,
        targetType: notice.targetType,
        scheduledAt: notice.scheduledAt ? notice.scheduledAt.slice(0, 16) : '',
        expiresAt: notice.expiresAt ? notice.expiresAt.slice(0, 16) : '',
      })
      setTargetRoles(notice.targetRoles ?? [])
      setTargetDepts(notice.targetDepts ?? [])
    } else {
      reset({ title: '', body: '', targetType: 'ALL', scheduledAt: '', expiresAt: '' })
      setTargetRoles([])
      setTargetDepts([])
    }
    setFile(null)
  }, [open, notice, reset])

  const toggleRole = (id: string) => {
    setTargetRoles((prev) => (prev.includes(id) ? prev.filter((r) => r !== id) : [...prev, id]))
  }
  const toggleDept = (id: string) => {
    setTargetDepts((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]))
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        title: values.title,
        body: values.body,
        targetType: values.targetType,
        targetRoles: values.targetType === 'TARGETED' ? targetRoles : undefined,
        targetDepts: values.targetType === 'TARGETED' ? targetDepts : undefined,
        scheduledAt: values.scheduledAt ? new Date(values.scheduledAt).toISOString() : undefined,
        expiresAt: values.expiresAt ? new Date(values.expiresAt).toISOString() : undefined,
      }
      const saved = isEdit ? await noticesApi.update(notice.id, payload) : await noticesApi.create(payload)
      if (file) {
        await noticesApi.uploadAttachment(saved.id, file)
      }
      return saved
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notices'] })
      onOpenChange(false)
      toast.success(isEdit ? 'Notice updated.' : 'Notice created.')
    },
    onError: () => toast.error(isEdit ? 'Failed to update notice.' : 'Failed to create notice.'),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
      }}
    >
      <DialogContent className="w-[92vw] sm:w-[85vw] lg:w-[70vw] max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Notice' : 'Create Notice'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => save(v))} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input id="title" placeholder="Notice title" {...register('title')} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="body">Body *</Label>
            <Textarea id="body" placeholder="Notice content..." rows={5} {...register('body')} />
            {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Target Audience *</Label>
            <Select
              items={{ ALL: 'All Employees', TARGETED: 'Targeted (Roles / Departments)' }}
              value={targetType ?? 'ALL'}
              onValueChange={(v) => setValue('targetType', (v as NoticeTargetType) ?? 'ALL')}
            >
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Employees</SelectItem>
                <SelectItem value="TARGETED">Targeted (Roles / Departments)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {targetType === 'TARGETED' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Roles</Label>
                <div className="max-h-32 overflow-y-auto space-y-1.5 rounded-md border border-border p-2">
                  {roles.map((r) => (
                    <label key={r.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={targetRoles.includes(r.id)} onCheckedChange={() => toggleRole(r.id)} />
                      <span className="text-sm text-foreground">{r.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Departments</Label>
                <div className="max-h-32 overflow-y-auto space-y-1.5 rounded-md border border-border p-2">
                  {departments.map((d) => (
                    <label key={d.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={targetDepts.includes(d.id)} onCheckedChange={() => toggleDept(d.id)} />
                      <span className="text-sm text-foreground">{d.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="scheduledAt">Schedule For (optional)</Label>
              <Input id="scheduledAt" type="datetime-local" {...register('scheduledAt')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="expiresAt">Expires At (optional)</Label>
              <Input id="expiresAt" type="datetime-local" {...register('expiresAt')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="attachment">Attachment (optional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="attachment"
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {(file ?? notice?.attachmentName) && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                  <Paperclip className="h-3.5 w-3.5" />
                  {file?.name ?? notice?.attachmentName}
                </span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Save Changes' : 'Create Notice'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
