import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Megaphone, Plus, Send, Eye, Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { noticesApi } from '@/api/notices.api'
import type { Notice, NoticeStatus } from '@/types/notices.types'
import type { PaginatedMeta } from '@/types/api.types'
import { usePagination } from '@/hooks/usePagination'
import { usePermission } from '@/hooks/usePermission'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { NoticeFormDialog } from './NoticeFormDialog'
import { ReadReceiptsDialog } from './ReadReceiptsDialog'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-slate-100 text-slate-600',
  scheduled: 'bg-amber-100 text-amber-700',
  published: 'bg-emerald-100 text-emerald-700',
}

export function ManageNoticesPage() {
  const qc = useQueryClient()
  const { page, limit, setPage } = usePagination()
  const canManage = usePermission('onboarding:manage')
  const [status, setStatus] = useState<NoticeStatus | ''>('')
  const [formOpen, setFormOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Notice | null>(null)
  const [receiptsTarget, setReceiptsTarget] = useState<Notice | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Notice | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['notices', 'manage', { page, limit, status }],
    queryFn: () => noticesApi.listManage({ page, limit, status: status || undefined }),
    enabled: canManage,
  })

  const rows = (data as { data?: Notice[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const { mutate: publish } = useMutation({
    mutationFn: (id: string) => noticesApi.publish(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notices'] })
      toast.success('Notice published.')
    },
    onError: () => toast.error('Failed to publish notice.'),
  })

  const { mutate: remove, isPending: isDeleting } = useMutation({
    mutationFn: (id: string) => noticesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notices'] })
      setDeleteTarget(null)
      toast.success('Notice deleted.')
    },
    onError: () => toast.error('Failed to delete notice.'),
  })

  const columns: Column<Notice>[] = [
    {
      key: 'title',
      header: 'Title',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-foreground">{row.title}</p>
          <p className="text-xs text-muted-foreground">
            {row.targetType === 'ALL' ? 'All Employees' : 'Targeted'}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} type="generic" colorClass={STATUS_COLORS[row.status]} />,
    },
    {
      key: 'readCount',
      header: 'Read Count',
      render: (row) => (
        <button
          className="text-sm text-blue-600 hover:underline"
          onClick={(e) => {
            e.stopPropagation()
            setReceiptsTarget(row)
          }}
        >
          {row.readCount ?? 0}
        </button>
      ),
    },
    {
      key: 'scheduledAt',
      header: 'Scheduled',
      render: (row) => (row.scheduledAt ? formatDate(row.scheduledAt) : '—'),
    },
    {
      key: 'publishedAt',
      header: 'Published',
      render: (row) => (row.publishedAt ? formatDate(row.publishedAt) : '—'),
    },
    { key: 'createdAt', header: 'Created', render: (row) => formatDate(row.createdAt) },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex items-center gap-1">
          {canManage && (row.status === 'draft' || row.status === 'scheduled') && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation()
                publish(row.id)
              }}
            >
              <Send className="h-3.5 w-3.5 mr-1" />
              Publish
            </Button>
          )}
          {canManage && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation()
                setEditTarget(row)
                setFormOpen(true)
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation()
              setReceiptsTarget(row)
            }}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          {canManage && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                setDeleteTarget(row)
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ]

  if (!canManage) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Manage Notices</h1>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          You do not have permission to manage notices.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Manage Notices</h1>
            <p className="text-sm text-muted-foreground">{meta?.total ?? 0} notices</p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setEditTarget(null)
            setFormOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          New Notice
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select value={status} onValueChange={(v) => setStatus((v as NoticeStatus) ?? '')}>
          <SelectTrigger className="w-40"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="published">Published</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={rows}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        rowKey={(r) => r.id}
        emptyMessage="No notices found."
      />

      <NoticeFormDialog open={formOpen} onOpenChange={setFormOpen} notice={editTarget} />

      <ReadReceiptsDialog
        open={!!receiptsTarget}
        onOpenChange={(o) => !o && setReceiptsTarget(null)}
        notice={receiptsTarget}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Notice"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        loading={isDeleting}
        onConfirm={() => deleteTarget && remove(deleteTarget.id)}
      />
    </div>
  )
}
