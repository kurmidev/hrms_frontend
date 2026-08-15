import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { usePagination } from '@/hooks/usePagination'
import { noticesApi } from '@/api/notices.api'
import type { Notice, NoticeReadReceipt } from '@/types/notices.types'
import type { PaginatedMeta } from '@/types/api.types'
import { formatDateTime } from '@/lib/utils'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  notice: Notice | null
}

export function ReadReceiptsDialog({ open, onOpenChange, notice }: Props) {
  const { page, limit, setPage } = usePagination()

  const { data, isLoading } = useQuery({
    queryKey: ['notices', notice?.id, 'read-receipts', { page, limit }],
    queryFn: () => noticesApi.getReadReceipts(notice!.id, { page, limit }),
    enabled: open && !!notice,
  })

  const rows = (data as { data?: NoticeReadReceipt[] })?.data ?? []
  const meta = (data as { meta?: PaginatedMeta })?.meta

  const columns: Column<NoticeReadReceipt>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (row) => (
        <div>
          <p className="text-sm font-medium text-foreground">
            {row.employee.firstName} {row.employee.lastName}
          </p>
          <p className="text-xs text-muted-foreground">{row.employee.empCode}</p>
        </div>
      ),
    },
    { key: 'readAt', header: 'Read On', render: (row) => formatDateTime(row.readAt) },
  ]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Read Receipts — {notice?.title}</DialogTitle>
        </DialogHeader>
        <DataTable
          columns={columns}
          data={rows}
          isLoading={isLoading}
          pagination={meta}
          onPageChange={setPage}
          rowKey={(r) => r.employeeId}
          emptyMessage="No one has read this notice yet."
        />
      </DialogContent>
    </Dialog>
  )
}
