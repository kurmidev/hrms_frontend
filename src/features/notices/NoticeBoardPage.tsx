import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Megaphone, Paperclip } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { noticesApi } from '@/api/notices.api'
import type { Notice } from '@/types/notices.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

export function NoticeBoardPage() {
  const qc = useQueryClient()
  const { page, limit, setPage } = usePagination()
  const [selected, setSelected] = useState<Notice | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['notices', 'board', { page, limit }],
    queryFn: () => noticesApi.listBoard({ page, limit }),
  })

  const rows = (data as { data?: Notice[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const { mutate: markRead } = useMutation({
    mutationFn: (id: string) => noticesApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notices', 'board'] })
    },
  })

  const openNotice = (notice: Notice) => {
    setSelected(notice)
    if (!notice.hasRead) {
      markRead(notice.id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Megaphone className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Notice Board</h1>
          <p className="text-sm text-muted-foreground">{meta?.total ?? 0} notices</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          No notices to show.
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((notice) => (
            <button
              key={notice.id}
              onClick={() => openNotice(notice)}
              className={cn(
                'w-full text-left rounded-lg border bg-card p-4 transition-colors hover:border-blue-300 hover:bg-blue-50/40',
                notice.hasRead ? 'border-border' : 'border-blue-300 bg-blue-50/30'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2 min-w-0">
                  {!notice.hasRead && (
                    <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{notice.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{notice.body}</p>
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end gap-1 text-xs text-muted-foreground">
                  <span>{formatDateTime(notice.publishedAt)}</span>
                  {notice.attachmentName && (
                    <span className="flex items-center gap-1">
                      <Paperclip className="h-3 w-3" />
                      Attachment
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(meta.page - 1)}
            disabled={meta.page <= 1}
          >
            Previous
          </Button>
          <span className="px-2 text-sm text-muted-foreground">
            {meta.page} / {meta.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(meta.page + 1)}
            disabled={meta.page >= meta.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selected?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Published {formatDateTime(selected?.publishedAt)}
            </p>
            <p className="whitespace-pre-wrap text-sm text-foreground">{selected?.body}</p>
            {selected?.attachmentUrl && (
              <a
                href={selected.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
              >
                <Paperclip className="h-3.5 w-3.5" />
                {selected.attachmentName ?? 'View attachment'}
              </a>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
