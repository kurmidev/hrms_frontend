import { useEffect, useRef, useCallback } from 'react'
import { io, type Socket } from 'socket.io-client'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth.store'
import type { ChatMessage } from '@/types/chat.types'

interface TypingPayload {
  roomId: string
  employeeId: string
}

type MessageListener = (message: ChatMessage) => void
type TypingListener = (payload: TypingPayload) => void

export function useChatSocket() {
  const accessToken = useAuthStore((s) => s.accessToken)
  const socketRef = useRef<Socket | null>(null)
  const messageListeners = useRef<Set<MessageListener>>(new Set())
  const typingListeners = useRef<Set<TypingListener>>(new Set())

  useEffect(() => {
    if (!accessToken) return

    const socket = io('/chat', {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('chat:message:new', (message: ChatMessage) => {
      messageListeners.current.forEach((listener) => listener(message))
    })

    socket.on('chat:typing', (payload: TypingPayload) => {
      typingListeners.current.forEach((listener) => listener(payload))
    })

    socket.on('chat:error', (payload: { message?: string }) => {
      toast.error(payload?.message ?? 'Chat error occurred.')
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [accessToken])

  const joinRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('chat:join', { roomId })
  }, [])

  const sendMessage = useCallback((roomId: string, content: string) => {
    socketRef.current?.emit('chat:message', { roomId, content })
  }, [])

  const sendTyping = useCallback((roomId: string) => {
    socketRef.current?.emit('chat:typing', { roomId })
  }, [])

  const onMessage = useCallback((listener: MessageListener) => {
    messageListeners.current.add(listener)
    return () => {
      messageListeners.current.delete(listener)
    }
  }, [])

  const onTyping = useCallback((listener: TypingListener) => {
    typingListeners.current.add(listener)
    return () => {
      typingListeners.current.delete(listener)
    }
  }, [])

  return { joinRoom, sendMessage, sendTyping, onMessage, onTyping }
}
