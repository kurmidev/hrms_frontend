import { useRef, useState } from 'react'
import { Paperclip, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface Props {
  onSend: (content: string) => void
  onAttach: (file: File) => void
  isUploading: boolean
  disabled?: boolean
}

export function MessageComposer({ onSend, onAttach, isUploading, disabled }: Props) {
  const [value, setValue] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || disabled) return
    onSend(trimmed)
    setValue('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) onAttach(file)
    e.target.value = ''
  }

  return (
    <div className="flex items-end gap-2 border-t border-border bg-white px-4 py-3">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled || isUploading}
        className={cn(
          'flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-border text-slate-500 transition-colors hover:border-teal-400 hover:text-teal-600 disabled:opacity-50'
        )}
        title="Attach a file"
      >
        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
      </button>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
          }
        }}
        placeholder="Type a message…"
        rows={1}
        disabled={disabled}
        className="max-h-32 flex-1 resize-none rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
      />
      <Button
        type="button"
        size="icon"
        onClick={handleSend}
        disabled={disabled || !value.trim()}
        className="h-9 w-9 flex-shrink-0 bg-teal-600 hover:bg-teal-700"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  )
}
