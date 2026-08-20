import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Resolver } from 'react-hook-form'
import { Clock, Plus, Loader2, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { attendanceApi } from '@/api/attendance.api'
import type { AttendanceLog } from '@/types/attendance.types'
import { ATTENDANCE_STATUS_LABELS } from '@/lib/constants'
import { formatDate, formatDateTime } from '@/lib/utils'
import { usePagination } from '@/hooks/usePagination'
import { toast } from 'sonner'

const schema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  date: z.string().min(1, 'Date is required'),
  checkInAt: z.string().optional(),
  checkOutAt: z.string().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

export function AttendancePage() {
  const qc = useQueryClient()
  const { page, limit, setPage, reset } = usePagination()
  const [date, setDate] = useState('')
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', { page, limit, date, status }],
    queryFn: () =>
      attendanceApi.list({
        page,
        limit,
        date: date || undefined,
        status: status || undefined,
      }),
  })

  const logs: AttendanceLog[] = (data as { data?: AttendanceLog[] })?.data ?? []
  const meta = (data as { meta?: { total: number; page: number; limit: number; totalPages: number } })?.meta

  const { register, handleSubmit, reset: resetForm, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })

  const { mutate: save, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      attendanceApi.manualEntry({
        employeeId: values.employeeId,
        date: values.date,
        checkInAt: values.checkInAt || undefined,
        checkOutAt: values.checkOutAt || undefined,
        status: values.status ? (values.status as AttendanceLog['status']) : undefined,
        notes: values.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] })
      setOpen(false)
      toast.success('Attendance entry saved.')
    },
    onError: () => toast.error('Failed to save attendance entry.'),
  })

  const openCreate = () => {
    resetForm({ employeeId: '', date: '', checkInAt: '', checkOutAt: '', status: '', notes: '' })
    setOpen(true)
  }

  const renderLocation = (name?: string | null, lat?: number | null, lng?: number | null) => {
    if (name) {
      return (
        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
          <MapPin className="h-3 w-3" />
          {name}
        </span>
      )
    }
    if (lat != null && lng != null) {
      return <span className="text-xs text-muted-foreground">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
    }
    return <span className="text-xs text-muted-foreground">—</span>
  }

  const columns: Column<AttendanceLog>[] = [
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
    { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
    { key: 'checkInAt', header: 'Check-in', render: (row) => (row.checkInAt ? formatDateTime(row.checkInAt) : '—') },
    {
      key: 'checkInLocation',
      header: 'In Location',
      render: (row) => renderLocation(row.checkInLocationName, row.checkInLat, row.checkInLng),
    },
    { key: 'checkOutAt', header: 'Check-out', render: (row) => (row.checkOutAt ? formatDateTime(row.checkOutAt) : '—') },
    {
      key: 'checkOutLocation',
      header: 'Out Location',
      render: (row) => renderLocation(row.checkOutLocationName, row.checkOutLat, row.checkOutLng),
    },
    { key: 'totalHours', header: 'Hours', render: (row) => (row.totalHours != null ? row.totalHours.toFixed(2) : '—') },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} type="attendance" />,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Clock className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Attendance</h1>
            <p className="text-sm text-muted-foreground">{meta?.total ?? 0} records</p>
          </div>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Manual Entry
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          type="date"
          value={date}
          onChange={(e) => { setDate(e.target.value); reset() }}
          className="w-44"
        />
        <Select
          items={{ '': 'All Statuses', ...ATTENDANCE_STATUS_LABELS }}
          value={status}
          onValueChange={(v) => { setStatus(v ?? ''); reset() }}
        >
          <SelectTrigger className="w-44"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {Object.entries(ATTENDANCE_STATUS_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        pagination={meta}
        onPageChange={setPage}
        rowKey={(r) => r.id}
        emptyMessage="No attendance records found."
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Manual Attendance Entry</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit((v) => save(v))} className="flex flex-col gap-4 px-4 flex-1 overflow-y-auto">
            <div className="space-y-1.5">
              <Label htmlFor="employeeId">Employee ID *</Label>
              <Input id="employeeId" placeholder="Employee UUID" {...register('employeeId')} />
              {errors.employeeId && <p className="text-xs text-destructive">{errors.employeeId.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checkInAt">Check-in Time</Label>
              <Input id="checkInAt" type="datetime-local" {...register('checkInAt')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="checkOutAt">Check-out Time</Label>
              <Input id="checkOutAt" type="datetime-local" {...register('checkOutAt')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" placeholder="Reason for manual entry…" {...register('notes')} />
            </div>
            <SheetFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Entry
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
