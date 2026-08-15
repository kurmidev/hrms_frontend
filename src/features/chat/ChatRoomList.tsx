import { MessageSquarePlus, Users, Building2, User } from 'lucide-react'
import { cn, formatDate, getInitials } from '@/lib/utils'
import type { ChatRoom } from '@/types/chat.types'

interface Props {
  rooms: ChatRoom[]
  activeRoomId: string | null
  currentEmployeeId: string | null
  onSelect: (room: ChatRoom) => void
  onNewChat: () => void
  isLoading: boolean
}

function roomDisplayName(room: ChatRoom, currentEmployeeId: string | null): string {
  if (room.name) return room.name
  if (room.type === 'DIRECT') {
    const other = room.members.find((m) => m.employeeId !== currentEmployeeId)
    return other?.name ?? 'Direct message'
  }
  return 'Chat'
}

function roomIcon(type: ChatRoom['type']) {
  if (type === 'GROUP') return Users
  if (type === 'DEPARTMENT') return Building2
  return User
}

export function ChatRoomList({ rooms, activeRoomId, currentEmployeeId, onSelect, onNewChat, isLoading }: Props) {
  return (
    <div className="flex h-full flex-col border-r border-border bg-slate-50/60">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">Conversations</h2>
          <p className="text-xs text-muted-foreground">{rooms.length} active</p>
        </div>
        <button
          onClick={onNewChat}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm transition-transform hover:scale-105 hover:bg-teal-700 active:scale-95"
          title="New chat"
        >
          <MessageSquarePlus className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-200/70" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-16 text-center">
            <MessageSquarePlus className="h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">No conversations yet</p>
            <p className="text-xs text-muted-foreground">Start a direct, group, or department chat.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border/60">
            {rooms.map((room) => {
              const Icon = roomIcon(room.type)
              const label = roomDisplayName(room, currentEmployeeId)
              const active = room.id === activeRoomId
              const preview = room.lastMessage
                ? room.lastMessage.deletedAt
                  ? 'Message deleted'
                  : room.lastMessage.content ?? (room.lastMessage.fileName ?? 'Attachment')
                : 'No messages yet'

              return (
                <li key={room.id}>
                  <button
                    onClick={() => onSelect(room)}
                    className={cn(
                      'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
                      active ? 'bg-teal-50 border-l-2 border-l-teal-600' : 'hover:bg-slate-100 border-l-2 border-l-transparent'
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                        active ? 'bg-teal-600 text-white' : 'bg-slate-200 text-slate-600'
                      )}
                    >
                      {room.type === 'DIRECT' ? getInitials(label.split(' ')[0], label.split(' ')[1]) : <Icon className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn('truncate text-sm font-semibold', active ? 'text-teal-800' : 'text-foreground')}>
                          {label}
                        </p>
                        {room.lastMessage && (
                          <span className="flex-shrink-0 text-[10px] text-muted-foreground">
                            {formatDate(room.lastMessage.sentAt, 'dd MMM')}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{preview}</p>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
