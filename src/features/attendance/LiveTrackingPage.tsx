import { useQuery } from '@tanstack/react-query'
import { Radar, MapPin } from 'lucide-react'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { attendanceApi } from '@/api/attendance.api'
import type { LiveLocation } from '@/types/attendance.types'
import { formatDateTime } from '@/lib/utils'

const LIVE_REFRESH_INTERVAL_MS = 60000

export function LiveTrackingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['attendance-live'],
    queryFn: () => attendanceApi.getLive(),
    refetchInterval: LIVE_REFRESH_INTERVAL_MS,
  })

  const locations: LiveLocation[] = Array.isArray(data) ? data : (data as { data?: LiveLocation[] })?.data ?? []

  const columns: Column<LiveLocation>[] = [
    {
      key: 'employee',
      header: 'Employee',
      render: (row) =>
        row.employee ? (
          <div>
            <p className="text-sm font-medium text-foreground">
              {row.employee.firstName} {row.employee.lastName}
            </p>
            <p className="text-xs text-muted-foreground">{row.employee.empCode}</p>
          </div>
        ) : (
          row.employeeId
        ),
    },
    {
      key: 'location',
      header: 'Location',
      render: (row) =>
        row.locationName ? (
          <span className="flex items-center gap-1 text-sm font-medium text-emerald-600">
            <MapPin className="h-3.5 w-3.5" />
            {row.locationName}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">
            {row.lat.toFixed(6)}, {row.lng.toFixed(6)}
          </span>
        ),
    },
    { key: 'accuracy', header: 'Accuracy (m)', render: (row) => (row.accuracy != null ? row.accuracy.toFixed(1) : '—') },
    { key: 'recordedAt', header: 'Recorded At', render: (row) => formatDateTime(row.recordedAt) },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Radar className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Live Tracking</h1>
          <p className="text-sm text-muted-foreground">Refreshes automatically every minute</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={locations}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        emptyMessage="No live locations reported."
      />
    </div>
  )
}
