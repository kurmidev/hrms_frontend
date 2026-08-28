import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Resolver } from 'react-hook-form'
import { MessageSquare, Pencil, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { smsTemplatesApi } from '@/api/sms-templates.api'
import type { SmsTemplate } from '@/types/sms-template.types'
import { usePermission } from '@/hooks/usePermission'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

const PLACEHOLDER_MAP: Record<string, string[]> = {
  otp: ['otp'],
  onboardingWelcome: ['empCode', 'email', 'tempPassword'],
  onboardingInvite: ['link'],
  employeeInvite: ['empCode', 'email', 'tempPassword'],
  employeeWelcome: ['firstName', 'empCode', 'loginUrl'],
}

const schema = z.object({
  message: z.string().min(1, 'Message is required'),
  tid: z.string().optional(),
  senderId: z.string().optional(),
  isActive: z.boolean().optional(),
})
type FormValues = z.infer<typeof schema>

export function SmsTemplatesPage() {
  const qc = useQueryClient()
  const canView = usePermission('sms_template:read')
  const canManage = usePermission('sms_template:update')

  const [open, setOpen] = useState(false)
  const [editItem, setEditItem] = useState<SmsTemplate | null>(null)

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['sms-templates'],
    queryFn: () => smsTemplatesApi.list(),
    enabled: canView,
  })

  const items = data ?? []

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    defaultValues: { message: '', tid: '', senderId: '', isActive: true },
  })

  const openEdit = (item: SmsTemplate) => {
    reset({
      message: item.message,
      tid: item.tid ?? '',
      senderId: item.senderId ?? '',
      isActive: item.isActive,
    })
    setEditItem(item)
    setOpen(true)
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: (values: FormValues) => {
      if (!editItem) throw new Error('No template selected')
      return smsTemplatesApi.update(editItem.id, {
        message: values.message,
        tid: values.tid?.trim() ? values.tid.trim() : null,
        senderId: values.senderId?.trim() ? values.senderId.trim() : null,
        isActive: values.isActive,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sms-templates'] })
      setOpen(false)
      toast.success('SMS template updated.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to update SMS template.')),
  })

  if (!canView) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">SMS Templates</h1>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          You do not have permission to view SMS templates.
        </div>
      </div>
    )
  }

  const columns: Column<SmsTemplate>[] = [
    { key: 'name', header: 'Name', render: (row) => <span className="font-medium text-foreground">{row.name}</span> },
    { key: 'key', header: 'Key', render: (row) => <code className="text-xs text-muted-foreground">{row.key}</code> },
    {
      key: 'message',
      header: 'Message',
      render: (row) => (
        <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs inline-block">
          {row.message}
        </span>
      ),
    },
    {
      key: 'tid',
      header: 'TID',
      render: (row) =>
        row.tid ? (
          <span className="text-sm text-foreground">{row.tid}</span>
        ) : (
          <StatusBadge status="Not configured" type="generic" colorClass="bg-accent-orange/10 text-accent-orange" />
        ),
    },
    {
      key: 'senderId',
      header: 'Sender ID',
      render: (row) =>
        row.senderId ? (
          <span className="text-sm text-foreground">{row.senderId}</span>
        ) : (
          <StatusBadge status="Uses default" type="generic" colorClass="bg-muted text-muted-foreground" />
        ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => (
        <StatusBadge
          status={row.isActive ? 'Active' : 'Inactive'}
          type="generic"
          colorClass={row.isActive ? 'bg-accent-green/10 text-accent-green' : 'bg-muted text-muted-foreground'}
        />
      ),
    },
    ...(canManage
      ? [{
          key: 'actions',
          header: '',
          render: (row: SmsTemplate) => (
            <div className="flex justify-end">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row)}>
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </div>
          ),
        } as Column<SmsTemplate>]
      : []),
  ]

  const placeholders = editItem ? PLACEHOLDER_MAP[editItem.key] ?? [] : []

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">SMS Templates</h1>
          <p className="text-sm text-muted-foreground">Manage the message content and DLT settings for system SMS notifications</p>
        </div>
      </div>

      {isError ? (
        <div className="rounded-lg border border-border bg-card p-8 text-center space-y-3">
          <p className="text-sm text-muted-foreground">Failed to load SMS templates.</p>
          <Button variant="outline" size="sm" onClick={() => refetch()}>Try again</Button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={items}
          isLoading={isLoading}
          rowKey={(r) => r.id}
          emptyMessage="No SMS templates found."
        />
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[92vw] sm:w-[85vw] lg:w-[70vw] max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit SMS Template</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit((v) => save(v))} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Key</Label>
                <Input value={editItem?.key ?? ''} disabled readOnly />
              </div>
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={editItem?.name ?? ''} disabled readOnly />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sms-message">Message *</Label>
              <Textarea id="sms-message" rows={4} {...register('message')} />
              {errors.message && <p className="text-xs text-destructive">{errors.message.message}</p>}
              {placeholders.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Available placeholders:{' '}
                  {placeholders.map((p) => (
                    <code key={p} className="mx-0.5 rounded bg-muted px-1 py-0.5 text-[11px]">{`{{${p}}}`}</code>
                  ))}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="sms-tid">DLT Template ID (TID)</Label>
                <Input id="sms-tid" placeholder="Not configured" {...register('tid')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="sms-sender-id">Sender ID</Label>
                <Input id="sms-sender-id" placeholder="Uses default" {...register('senderId')} />
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" className="h-4 w-4" {...register('isActive')} />
              Active
            </label>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
