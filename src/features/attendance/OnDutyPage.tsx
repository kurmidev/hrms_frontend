import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Resolver } from 'react-hook-form'
import { MapPin, MapPinPlus, Navigation, Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DataTable, type Column } from '@/components/shared/DataTable'
import { odApi } from '@/api/od.api'
import type { OdRecord, OdLocationEntry } from '@/types/od.types'
import { formatDateTime } from '@/lib/utils'
import { usePermission } from '@/hooks/usePermission'
import { toast } from 'sonner'

interface Coords {
  lat: number
  lng: number
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
    })
  })
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

const markSchema = z.object({
  hours: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number({ message: 'Hours are required' }).min(0.1, 'Must be at least 6 minutes'),
  ),
  reason: z.string().optional(),
})
type MarkValues = z.infer<typeof markSchema>

const addSchema = z.object({
  hours: z.preprocess(
    (v) => (v === '' ? undefined : Number(v)),
    z.number({ message: 'Hours are required' }).min(0.1, 'Must be at least 6 minutes'),
  ),
})
type AddValues = z.infer<typeof addSchema>

function hoursToMinutes(hours: number): number {
  return Math.max(1, Math.round(hours * 60))
}

function minutesToHhMm(total: number): string {
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m}m`
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

export function OnDutyPage() {
  const qc = useQueryClient()
  const canMark = usePermission('attendance:checkin')
  const today = todayIso()

  const { data, isLoading } = useQuery({
    queryKey: ['od-today', today],
    queryFn: () => odApi.list({ date: today, limit: 20 }),
    enabled: canMark,
  })

  const records = (data as { data?: OdRecord[] })?.data ?? []
  const todayRecord = records[0] ?? null
  const entries: OdLocationEntry[] = todayRecord?.entries ?? []

  const markForm = useForm<MarkValues>({ resolver: zodResolver(markSchema) as Resolver<MarkValues> })
  const addForm = useForm<AddValues>({ resolver: zodResolver(addSchema) as Resolver<AddValues> })

  const [markLocating, setMarkLocating] = useState(false)
  const [addLocating, setAddLocating] = useState(false)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['od-today'] })

  const { mutate: mark, isPending: marking } = useMutation({
    mutationFn: (payload: { coords: Coords; hours: number; reason?: string }) =>
      odApi.create({
        lat: payload.coords.lat,
        lng: payload.coords.lng,
        minutes: hoursToMinutes(payload.hours),
        reason: payload.reason,
      }),
    onSuccess: () => {
      invalidate()
      markForm.reset({ hours: undefined, reason: '' })
      toast.success('On-duty recorded for today.')
    },
    onError: () => toast.error('Failed to record on-duty.'),
  })

  const { mutate: addLocation, isPending: adding } = useMutation({
    mutationFn: (payload: { id: string; coords: Coords; hours: number }) =>
      odApi.addLocation(payload.id, {
        lat: payload.coords.lat,
        lng: payload.coords.lng,
        minutes: hoursToMinutes(payload.hours),
      }),
    onSuccess: () => {
      invalidate()
      addForm.reset({ hours: undefined })
      toast.success('Location entry added.')
    },
    onError: () => toast.error('Failed to add location entry.'),
  })

  const submitMark = async (values: MarkValues) => {
    setMarkLocating(true)
    try {
      const pos = await getCurrentPosition()
      mark({
        coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        hours: values.hours,
        reason: values.reason || undefined,
      })
    } catch {
      toast.error('Unable to fetch your location. Please enable location access.')
    } finally {
      setMarkLocating(false)
    }
  }

  const submitAdd = async (values: AddValues) => {
    if (!todayRecord) return
    setAddLocating(true)
    try {
      const pos = await getCurrentPosition()
      addLocation({
        id: todayRecord.id,
        coords: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        hours: values.hours,
      })
    } catch {
      toast.error('Unable to fetch your location. Please enable location access.')
    } finally {
      setAddLocating(false)
    }
  }

  const columns: Column<OdLocationEntry>[] = [
    {
      key: 'locationName',
      header: 'Location',
      render: (row) =>
        row.locationName ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <MapPin className="h-3.5 w-3.5 text-emerald-600" />
            {row.locationName}
          </span>
        ) : (
          <span className="text-sm text-muted-foreground">
            {row.lat.toFixed(5)}, {row.lng.toFixed(5)}
          </span>
        ),
    },
    { key: 'minutes', header: 'Duration', render: (row) => minutesToHhMm(row.minutes) },
    { key: 'recordedAt', header: 'Recorded At', render: (row) => formatDateTime(row.recordedAt) },
  ]

  if (!canMark) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <Navigation className="h-10 w-10 text-muted-foreground mb-3" />
        <h1 className="text-lg font-semibold text-foreground">On Duty</h1>
        <p className="text-sm text-muted-foreground mt-1">
          You don't have permission to record on-duty time.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
          <Navigation className="h-5 w-5 text-emerald-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">On Duty</h1>
          <p className="text-sm text-muted-foreground">Record off-site work time by location</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Mark On Duty</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={markForm.handleSubmit(submitMark)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="mark-hours">Hours on duty *</Label>
                <Input id="mark-hours" type="number" step="0.25" placeholder="1.5" {...markForm.register('hours')} />
                {markForm.formState.errors.hours && (
                  <p className="text-xs text-destructive">{markForm.formState.errors.hours.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mark-reason">Reason</Label>
                <Textarea id="mark-reason" placeholder="Client site visit for onboarding demo…" {...markForm.register('reason')} />
              </div>
              <Button type="submit" disabled={markLocating || marking} className="w-full">
                {(markLocating || marking) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Navigation className="mr-2 h-4 w-4" />}
                Capture Location & Mark
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span>Today's Total</span>
              <span className="flex items-center gap-1.5 text-emerald-600">
                <Clock className="h-4 w-4" />
                {minutesToHhMm(todayRecord?.totalMinutes ?? 0)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {todayRecord?.reason && (
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">Reason:</span> {todayRecord.reason}
              </p>
            )}
            <form onSubmit={addForm.handleSubmit(submitAdd)} className="space-y-3">
              <Label htmlFor="add-hours">Add another location</Label>
              <div className="flex gap-2">
                <Input
                  id="add-hours"
                  type="number"
                  step="0.25"
                  placeholder="Hours"
                  disabled={!todayRecord}
                  {...addForm.register('hours')}
                />
                <Button type="submit" variant="outline" disabled={!todayRecord || addLocating || adding}>
                  {(addLocating || adding) ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPinPlus className="h-4 w-4" />}
                </Button>
              </div>
              {addForm.formState.errors.hours && (
                <p className="text-xs text-destructive">{addForm.formState.errors.hours.message}</p>
              )}
              {!todayRecord && (
                <p className="text-xs text-muted-foreground">Mark on duty first to append more locations.</p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Location Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={entries}
            isLoading={isLoading}
            rowKey={(r) => r.id}
            emptyMessage="No on-duty locations recorded today."
          />
        </CardContent>
      </Card>
    </div>
  )
}
