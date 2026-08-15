import { Paperclip, Ban } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import type { ChatMessage } from '@/types/chat.types'

interface Props {
  message: ChatMessage
  isOwn: boolean
  showSender: boolean
}

export function MessageBubble({ message, isOwn, showSender }: Props) {
  if (message.deletedAt) {
    return (
      <div className={cn('flex', isOwn ? 'justify-end' : 'justify-start')}>
        <div className="flex items-center gap-1.5 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3.5 py-2 text-xs italic text-slate-400">
          <Ban className="h-3 w-3" />
          This message was deleted
        </div>
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
      {showSender && !isOwn && (
        <span className="mb-0.5 ml-1 text-[11px] font-semibold text-slate-500">{message.senderName}</span>
      )}
      <div
        className={cn(
          'max-w-[70%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
          isOwn
            ? 'rounded-tr-sm bg-teal-600 text-white'
            : 'rounded-tl-sm border border-border bg-white text-foreground'
        )}
      >
        {message.content && <p className="whitespace-pre-wrap break-words">{message.content}</p>}
        {message.fileUrl && (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              'mt-1 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium underline-offset-2 hover:underline',
              isOwn ? 'bg-teal-700/50 text-teal-50' : 'bg-slate-100 text-teal-700'
            )}
          >
            <Paperclip className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{message.fileName ?? 'Attachment'}</span>
          </a>
        )}
        <p className={cn('mt-1 text-right text-[10px]', isOwn ? 'text-teal-100' : 'text-muted-foreground')}>
          {formatDate(message.sentAt, 'HH:mm')}
          {message.editedAt ? ' · edited' : ''}
        </p>
      </div>
    </div>
  )
}
