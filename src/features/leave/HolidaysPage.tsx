import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Resolver } from 'react-hook-form'
import { CalendarDays, Plus, Loader2, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { leaveApi } from '@/api/leave.api'
import type { Holiday, HolidayType } from '@/types/leave.types'
import { formatDate } from '@/lib/utils'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

const CURRENT_YEAR = 2026
const YEAR_OPTIONS = [2024, 2025, 2026, 2027, 2028]

const HOLIDAY_TYPE_COLORS: Record<HolidayType, string> = {
  NATIONAL: 'bg-blue-100 text-blue-700',
  OPTIONAL: 'bg-orange-100 text-orange-700',
}

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  date: z.string().min(1, 'Date is required'),
  type: z.enum(['NATIONAL', 'OPTIONAL']),
})
type FormValues = z.infer<typeof schema>

export function HolidaysPage() {
  const qc = useQueryClient()
  const { hasPermission } = useAuthStore()
  const canManage = hasPermission('org:update')

  const [year, setYear] = useState(CURRENT_YEAR)
  const [open, setOpen] = useState(false)
  const [editHoliday, setEditHoliday] = useState<Holiday | null>(null)
  const [deleteHoliday, setDeleteHoliday] = useState<Holiday | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['holidays', { year }],
    queryFn: () => leaveApi.getHolidays(year),
  })

  const holidays: Holiday[] = Array.isArray(data) ? data : []

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
  })
  const selectedType = watch('type')

  const openCreate = () => {
    reset({ name: '', date: '', type: 'NATIONAL' })
    setEditHoliday(null)
    setOpen(true)
  }

  const openEdit = (holiday: Holiday) => {
    reset({ name: holiday.name, date: holiday.date.slice(0, 10), type: holiday.type })
    setEditHoliday(holiday)
    setOpen(true)
  }

  const { mutate: save, isPending } = useMutation({
    mutationFn: (values: FormValues) =>
      editHoliday
        ? leaveApi.updateHoliday(editHoliday.id, values)
        : leaveApi.createHoliday(values),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holidays'] })
      setOpen(false)
      toast.success(editHoliday ? 'Holiday updated.' : 'Holiday created.')
    },
    onError: () => toast.error('Failed to save holiday.'),
  })

  const { mutate: del, isPending: deleting } = useMutation({
    mutationFn: (id: string) => leaveApi.deleteHoliday(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['holidays'] })
      setDeleteHoliday(null)
      toast.success('Holiday deleted.')
    },
    onError: () => toast.error('Failed to delete holiday.'),
  })

  const columns: Column<Holiday>[] = [
    { key: 'name', header: 'Name' },
    { key: 'date', header: 'Date', render: (row) => formatDate(row.date) },
    {
      key: 'type',
      header: 'Type',
      render: (row) => (
        <StatusBadge status={row.type} type="generic" label={row.type} colorClass={HOLIDAY_TYPE_COLORS[row.type]} />
      ),
    },
    ...(canManage
      ? [
          {
            key: 'actions',
            header: '',
            render: (row: Holiday) => (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(row)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={() => setDeleteHoliday(row)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ),
          } satisfies Column<Holiday>,
        ]
      : []),
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <CalendarDays className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Holiday Calendar</h1>
            <p className="text-sm text-muted-foreground">Manage organization-wide holidays</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v ?? CURRENT_YEAR))}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              {YEAR_OPTIONS.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {canManage && (
            <Button onClick={openCreate} size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Add Holiday
            </Button>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={holidays}
        isLoading={isLoading}
        rowKey={(r) => r.id}
        emptyMessage="No holidays found for this year."
      />

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>{editHoliday ? 'Edit Holiday' : 'Add Holiday'}</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSubmit((v) => save(v))} className="flex flex-col gap-4 px-4 flex-1 overflow-y-auto">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name *</Label>
              <Input id="name" placeholder="e.g. Republic Day" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date *</Label>
              <Input id="date" type="date" {...register('date')} />
              {errors.date && <p className="text-xs text-destructive">{errors.date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="type">Type *</Label>
              <Select
                value={selectedType ?? ''}
                onValueChange={(v) => setValue('type', (v ?? 'NATIONAL') as HolidayType)}
              >
                <SelectTrigger className="w-full"><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NATIONAL">National</SelectItem>
                  <SelectItem value="OPTIONAL">Optional</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-xs text-destructive">{errors.type.message}</p>}
            </div>
            <SheetFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editHoliday ? 'Save Changes' : 'Create'}
              </Button>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!deleteHoliday}
        onOpenChange={(o) => !o && setDeleteHoliday(null)}
        title="Delete Holiday"
        description={`Delete "${deleteHoliday?.name}"? This action cannot be undone.`}
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={() => deleteHoliday && del(deleteHoliday.id)}
        variant="destructive"
      />
    </div>
  )
}
