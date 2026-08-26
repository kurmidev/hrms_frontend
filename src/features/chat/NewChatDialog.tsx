import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Users, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { cn, getApiErrorMessage } from '@/lib/utils'
import { chatApi } from '@/api/chat.api'
import type { ChatRoom, ChatRoomType, ChatEmployeeRef } from '@/types/chat.types'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: (room: ChatRoom) => void
}

const ROOM_TYPES: { value: ChatRoomType; label: string; icon: typeof User; hint: string }[] = [
  { value: 'DIRECT', label: 'Direct Message', icon: User, hint: 'One-on-one with a colleague' },
  { value: 'GROUP', label: 'Group', icon: Users, hint: 'Named group with hand-picked members' },
]

export function NewChatDialog({ open, onOpenChange, onCreated }: Props) {
  const qc = useQueryClient()
  const [type, setType] = useState<ChatRoomType>('DIRECT')
  const [name, setName] = useState('')
  const [memberIds, setMemberIds] = useState<string[]>([])

  const { data: employees = [] } = useQuery<ChatEmployeeRef[]>({
    queryKey: ['chat-employees'],
    queryFn: () => chatApi.listEmployees(),
    enabled: open,
  })

  const resetForm = () => {
    setType('DIRECT')
    setName('')
    setMemberIds([])
  }

  const toggleMember = (id: string) => {
    setMemberIds((prev) => {
      if (type === 'DIRECT') return prev.includes(id) ? [] : [id]
      return prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    })
  }

  const { mutate: create, isPending } = useMutation({
    mutationFn: () =>
      chatApi.createRoom({
        type,
        name: type === 'GROUP' ? name : undefined,
        memberEmployeeIds: memberIds,
      }),
    onSuccess: (room) => {
      qc.invalidateQueries({ queryKey: ['chat-rooms'] })
      onCreated(room)
      onOpenChange(false)
      resetForm()
      toast.success('Chat ready.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to start chat.')),
  })

  const canSubmit =
    type === 'DIRECT'
      ? memberIds.length === 1
      : name.trim().length > 0 && memberIds.length >= 1

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) resetForm()
      }}
    >
      <DialogContent className="w-[92vw] sm:w-[85vw] max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Start a new chat</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="grid grid-cols-2 gap-2">
            {ROOM_TYPES.map((rt) => {
              const Icon = rt.icon
              const active = type === rt.value
              return (
                <button
                  key={rt.value}
                  type="button"
                  onClick={() => {
                    setType(rt.value)
                    setMemberIds([])
                  }}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-center transition-all',
                    active
                      ? 'border-primary bg-primary/10 text-primary shadow-sm'
                      : 'border-border text-muted-foreground hover:border-primary/40 hover:bg-primary/5'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-medium leading-tight">{rt.label}</span>
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            {ROOM_TYPES.find((r) => r.value === type)?.hint}
          </p>

          {type === 'GROUP' && (
            <div className="space-y-1.5">
              <Label htmlFor="group-name">Group name *</Label>
              <Input
                id="group-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Payroll Task Force"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label>{type === 'DIRECT' ? 'Colleague *' : 'Members *'}</Label>
            <div className="max-h-48 overflow-y-auto rounded-lg border border-border scrollbar-thin">
              {employees.map((emp) => {
                const selected = memberIds.includes(emp.id)
                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => toggleMember(emp.id)}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 border-b border-border/60 px-3 py-2 text-left text-sm last:border-b-0 transition-colors',
                      selected ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                    )}
                  >
                    <span className="truncate">
                      {emp.firstName} {emp.lastName}
                      <span className="ml-1.5 text-xs text-muted-foreground">{emp.empCode}</span>
                    </span>
                    {selected && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
                  </button>
                )
              })}
              {employees.length === 0 && (
                <p className="px-3 py-6 text-center text-xs text-muted-foreground">No employees found.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={!canSubmit || isPending} onClick={() => create()}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Chat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
