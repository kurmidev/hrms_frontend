import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MapPin, LogIn, LogOut, Loader2, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { attendanceApi } from '@/api/attendance.api'
import type { AttendanceLog } from '@/types/attendance.types'
import { ATTENDANCE_STATUS_COLORS, ATTENDANCE_STATUS_LABELS } from '@/lib/constants'
import { formatDateTime, cn, getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

interface Coords {
  lat: number
  lng: number
  accuracy?: number
}

class LocationError extends Error {
  readonly permissionDenied: boolean

  constructor(message: string, permissionDenied: boolean) {
    super(message)
    this.permissionDenied = permissionDenied
  }
}

function geolocationErrorMessage(error: GeolocationPositionError): string {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return 'Location permission was blocked.'
    case error.POSITION_UNAVAILABLE:
      return 'Your location could not be determined. Check your device location settings and try again.'
    case error.TIMEOUT:
      return 'Location request timed out. Please try again.'
    default:
      return 'Unable to fetch your location. Please enable location access.'
  }
}

function getCurrentPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new LocationError('Geolocation is not supported by this browser.', false))
      return
    }
    navigator.geolocation.getCurrentPosition(
      resolve,
      (error) => reject(new LocationError(geolocationErrorMessage(error), error.code === error.PERMISSION_DENIED)),
      { enableHighAccuracy: true, timeout: 10000 }
    )
  })
}

const BROWSER_LOCATION_RESET_STEPS = [
  { browser: 'Chrome / Edge', steps: 'Click the lock (or "i") icon left of the address bar → Site settings → set Location to Allow → reload this page.' },
  { browser: 'Firefox', steps: 'Click the lock icon left of the address bar → clear the location permission (or set it to Allow) → reload this page.' },
  { browser: 'Safari', steps: 'Safari menu → Settings for This Website → set Location to Allow → reload this page.' },
]

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

function monthRange(): { fromDate: string; toDate: string; year: number; month: number } {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const fromDate = new Date(year, month, 1).toISOString().slice(0, 10)
  const toDate = new Date(year, month + 1, 0).toISOString().slice(0, 10)
  return { fromDate, toDate, year, month }
}

export function MyAttendancePage() {
  const qc = useQueryClient()
  const [coords, setCoords] = useState<Coords | null>(null)
  const [locating, setLocating] = useState(true)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [showResetHelp, setShowResetHelp] = useState(false)
  const range = monthRange()

  // Request location as soon as the page loads (not only when Check In is
  // clicked) so the browser's permission prompt appears immediately on
  // arrival — check-in/out stay disabled until a location is actually
  // obtained, since the backend requires lat/lng for check-in regardless.
  useEffect(() => {
    setLocating(true)
    getCurrentPosition()
      .then((position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        })
        setLocationError(null)
        setPermissionDenied(false)
      })
      .catch((error: LocationError) => {
        setLocationError(error.message)
        setPermissionDenied(error.permissionDenied)
      })
      .finally(() => setLocating(false))
  }, [])

  const { data, isLoading } = useQuery({
    queryKey: ['my-attendance', range.fromDate, range.toDate],
    queryFn: () => attendanceApi.myAttendance({ fromDate: range.fromDate, toDate: range.toDate, limit: 31 }),
  })

  const logs: AttendanceLog[] = (data as { data?: AttendanceLog[] })?.data ?? []
  const todayLog = logs.find((l) => l.date.slice(0, 10) === todayIso())
  const hasCheckedIn = !!todayLog?.checkInAt
  const hasCheckedOut = !!todayLog?.checkOutAt

  const { mutate: checkIn, isPending: checkingIn } = useMutation({
    mutationFn: () =>
      attendanceApi.checkIn({
        lat: coords!.lat,
        lng: coords!.lng,
        accuracy: coords!.accuracy,
        source: 'WEB',
        timestamp: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-attendance'] })
      toast.success('Checked in successfully.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Check-in failed. You may already have an open check-in today.')),
  })

  const { mutate: checkOut, isPending: checkingOut } = useMutation({
    mutationFn: () =>
      attendanceApi.checkOut({
        lat: coords?.lat,
        lng: coords?.lng,
        source: 'WEB',
        timestamp: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-attendance'] })
      toast.success('Checked out successfully.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Check-out failed.')),
  })

  const handleLocateAndAct = async (action: 'in' | 'out') => {
    setLocating(true)
    try {
      const position = await getCurrentPosition()
      const next: Coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }
      setCoords(next)
      setLocationError(null)
      setPermissionDenied(false)
      if (action === 'in') checkIn()
      else checkOut()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to fetch your location. Please enable location access.'
      setLocationError(message)
      setPermissionDenied(error instanceof LocationError && error.permissionDenied)
    } finally {
      setLocating(false)
    }
  }

  const daysInMonth = new Date(range.year, range.month + 1, 0).getDate()
  const firstWeekday = new Date(range.year, range.month, 1).getDay()
  const logByDay = new Map<number, AttendanceLog>()
  logs.forEach((l) => {
    const d = new Date(l.date)
    logByDay.set(d.getDate(), l)
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <CalendarClock className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">My Attendance</h1>
          <p className="text-sm text-muted-foreground">Check in and view your monthly attendance</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Today</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {locationError ? (
            <div className="space-y-2 rounded-lg bg-accent-red/10 px-3 py-2 text-xs text-accent-red">
              <p className="flex items-start gap-1.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {locationError}
                {permissionDenied && (
                  <button
                    type="button"
                    onClick={() => setShowResetHelp((v) => !v)}
                    className="ml-1 shrink-0 underline underline-offset-2 hover:no-underline"
                  >
                    {showResetHelp ? 'Hide steps' : 'How to enable it'}
                  </button>
                )}
              </p>
              {permissionDenied && showResetHelp && (
                <ul className="space-y-1 border-t border-accent-red/20 pt-2 text-[11px] text-accent-red/90">
                  {BROWSER_LOCATION_RESET_STEPS.map(({ browser, steps }) => (
                    <li key={browser}>
                      <span className="font-semibold">{browser}:</span> {steps}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : coords ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Requesting your location…
            </p>
          )}
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div className="space-y-0.5">
              <span className="text-muted-foreground">Check-in</span>
              <p className="font-medium text-foreground">{todayLog?.checkInAt ? formatDateTime(todayLog.checkInAt) : '—'}</p>
              {todayLog?.checkInLocationName && (
                <p className="flex items-center gap-1 text-xs text-accent-green">
                  <MapPin className="h-3 w-3" />
                  {todayLog.checkInLocationName}
                </p>
              )}
            </div>
            <div className="space-y-0.5">
              <span className="text-muted-foreground">Check-out</span>
              <p className="font-medium text-foreground">{todayLog?.checkOutAt ? formatDateTime(todayLog.checkOutAt) : '—'}</p>
              {todayLog?.checkOutLocationName && (
                <p className="flex items-center gap-1 text-xs text-accent-green">
                  <MapPin className="h-3 w-3" />
                  {todayLog.checkOutLocationName}
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => handleLocateAndAct('in')}
              disabled={hasCheckedIn || locating || checkingIn || !coords}
            >
              {(locating || checkingIn) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogIn className="mr-2 h-4 w-4" />}
              Check In
            </Button>
            <Button
              variant="outline"
              onClick={() => handleLocateAndAct('out')}
              disabled={!hasCheckedIn || hasCheckedOut || locating || checkingOut || !coords}
            >
              {(locating || checkingOut) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              Check Out
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            {new Date(range.year, range.month).toLocaleString('default', { month: 'long', year: 'numeric' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground">{d}</div>
              ))}
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const log = logByDay.get(day)
                const colorClass = log ? ATTENDANCE_STATUS_COLORS[log.status] : 'bg-muted/40 text-muted-foreground'
                return (
                  <div
                    key={day}
                    title={log ? ATTENDANCE_STATUS_LABELS[log.status] : undefined}
                    className={cn(
                      'flex items-center justify-center h-10 rounded-lg text-xs font-medium border-0',
                      colorClass
                    )}
                  >
                    {day}
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
