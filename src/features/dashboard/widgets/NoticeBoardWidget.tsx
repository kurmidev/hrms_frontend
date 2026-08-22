import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Megaphone, Paperclip, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { noticesApi } from '@/api/notices.api'
import type { Notice } from '@/types/notices.types'
import { formatDate } from '@/lib/utils'

const MAX_ROWS = 5

export function NoticeBoardWidget() {
  const { data, isLoading } = useQuery({
    queryKey: ['notices', 'board', { page: 1, limit: MAX_ROWS }],
    queryFn: () => noticesApi.listBoard({ page: 1, limit: MAX_ROWS }),
  })

  const notices = ((data as { data?: Notice[] })?.data ?? [])
    .slice()
    .sort((a, b) => {
      const aDate = new Date(a.publishedAt ?? a.createdAt).getTime()
      const bDate = new Date(b.publishedAt ?? b.createdAt).getTime()
      return bDate - aDate
    })
    .slice(0, MAX_ROWS)

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" />
          Notice Board
        </CardTitle>
        <Link to="/notices" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : notices.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No notices.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium w-1/2">Title</th>
                  <th className="pb-2 font-medium w-1/3">File</th>
                  <th className="pb-2 font-medium text-right">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {notices.map((notice) => (
                  <tr key={notice.id}>
                    <td className="py-2 pr-2 text-foreground truncate">{notice.title}</td>
                    <td className="py-2 pr-2 text-muted-foreground">
                      {notice.attachmentName ? (
                        <span className="flex items-center gap-1 min-w-0">
                          <Paperclip className="h-3 w-3 shrink-0" />
                          <span className="truncate">{notice.attachmentName}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="py-2 text-right text-muted-foreground whitespace-nowrap">
                      {formatDate(notice.publishedAt ?? notice.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
