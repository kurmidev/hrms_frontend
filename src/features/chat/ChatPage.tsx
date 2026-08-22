import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MessageSquareText, Users, Building2, User } from 'lucide-react'
import { chatApi } from '@/api/chat.api'
import type { ChatMessage, ChatRoom } from '@/types/chat.types'
import type { PaginatedMeta } from '@/types/api.types'
import { useAuthStore } from '@/store/auth.store'
import { useChatSocket } from '@/hooks/useChatSocket'
import { ChatRoomList } from './ChatRoomList'
import { MessageBubble } from './MessageBubble'
import { MessageComposer } from './MessageComposer'
import { NewChatDialog } from './NewChatDialog'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

function roomDisplayName(room: ChatRoom | null, currentEmployeeId: string | null): string {
  if (!room) return ''
  if (room.name) return room.name
  if (room.type === 'DIRECT') {
    const other = room.members.find((m) => m.employeeId !== currentEmployeeId)
    return other?.name ?? 'Direct message'
  }
  return 'Chat'
}

function roomIcon(type: ChatRoom['type'] | undefined) {
  if (type === 'GROUP') return Users
  if (type === 'DEPARTMENT') return Building2
  return User
}

export function ChatPage() {
  const qc = useQueryClient()
  const currentEmployeeId = useAuthStore((s) => s.user?.employee?.id ?? null)
  const [activeRoom, setActiveRoom] = useState<ChatRoom | null>(null)
  const [newChatOpen, setNewChatOpen] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const scrollAnchorRef = useRef<HTMLDivElement>(null)
  const { joinRoom, sendMessage, onMessage } = useChatSocket()

  const { data: roomsData, isLoading: roomsLoading } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: () => chatApi.listRooms(),
  })
  const rooms = roomsData ?? []

  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['chat-messages', activeRoom?.id],
    queryFn: () => chatApi.getMessages(activeRoom!.id, { limit: 50 }),
    enabled: !!activeRoom,
  })
  const messages = (messagesData as { data?: ChatMessage[] })?.data ?? []
  const messagesMeta = (messagesData as { meta?: PaginatedMeta })?.meta
  void messagesMeta

  useEffect(() => {
    if (!activeRoom) return
    joinRoom(activeRoom.id)
  }, [activeRoom, joinRoom])

  useEffect(() => {
    const unsubscribe = onMessage((message) => {
      qc.setQueryData(['chat-messages', message.roomId], (prev: unknown) => {
        const current = prev as { data?: ChatMessage[]; meta?: PaginatedMeta } | undefined
        if (!current?.data) return current
        if (current.data.some((m) => m.id === message.id)) return current
        return { ...current, data: [...current.data, message] }
      })
      qc.invalidateQueries({ queryKey: ['chat-rooms'] })
    })
    return unsubscribe
  }, [onMessage, qc])

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const { mutate: uploadAttachment } = useMutation({
    mutationFn: (file: File) => {
      if (!activeRoom) return Promise.reject(new Error('No active room'))
      return chatApi.uploadAttachment(activeRoom.id, file)
    },
    onMutate: () => setIsUploading(true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['chat-messages', activeRoom?.id] })
      qc.invalidateQueries({ queryKey: ['chat-rooms'] })
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to send attachment.')),
    onSettled: () => setIsUploading(false),
  })

  const handleSend = (content: string) => {
    if (!activeRoom) return
    sendMessage(activeRoom.id, content)
  }

  const handleRoomCreated = (room: ChatRoom) => {
    setActiveRoom(room)
  }

  const activeLabel = useMemo(() => roomDisplayName(activeRoom, currentEmployeeId), [activeRoom, currentEmployeeId])
  const ActiveIcon = roomIcon(activeRoom?.type)

  return (
    <div className="flex h-[calc(100vh-8rem)] overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="w-72 flex-shrink-0">
        <ChatRoomList
          rooms={rooms}
          activeRoomId={activeRoom?.id ?? null}
          currentEmployeeId={currentEmployeeId}
          onSelect={setActiveRoom}
          onNewChat={() => setNewChatOpen(true)}
          isLoading={roomsLoading}
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {!activeRoom ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center">
            <MessageSquareText className="h-10 w-10 text-slate-200" />
            <p className="text-sm font-medium text-slate-500">Select a conversation</p>
            <p className="text-xs text-muted-foreground">Or start a new direct, group, or department chat.</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                <ActiveIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{activeLabel}</p>
                <p className="text-xs text-muted-foreground">
                  {activeRoom.members.filter((m) => !m.revokedAt).length} member(s)
                </p>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 scrollbar-thin">
              {messagesLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 w-1/2 animate-pulse rounded-2xl bg-slate-100" />
                  ))}
                </div>
              ) : messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-1 text-center">
                  <p className="text-sm font-medium text-slate-400">No messages yet</p>
                  <p className="text-xs text-muted-foreground">Say hello to get the conversation started.</p>
                </div>
              ) : (
                messages.map((message, idx) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isOwn={message.senderId === currentEmployeeId}
                    showSender={idx === 0 || messages[idx - 1].senderId !== message.senderId}
                  />
                ))
              )}
              <div ref={scrollAnchorRef} />
            </div>

            <MessageComposer
              onSend={handleSend}
              onAttach={(file) => uploadAttachment(file)}
              isUploading={isUploading}
            />
          </>
        )}
      </div>

      <NewChatDialog open={newChatOpen} onOpenChange={setNewChatOpen} onCreated={handleRoomCreated} />
    </div>
  )
}
