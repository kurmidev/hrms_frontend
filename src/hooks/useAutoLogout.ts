import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'

// setTimeout uses a 32-bit signed int internally; delays beyond ~24.8 days
// overflow and fire immediately. Re-arm at most once a day so we never get
// anywhere near that ceiling, and so a long-open tab keeps re-evaluating the
// cutoff (e.g. after an org admin changes the configured time).
const MAX_TIMEOUT_MS = 24 * 60 * 60 * 1000

/**
 * Interpret `date`'s wall-clock time in `timezone` as if it were UTC, and
 * return the equivalent epoch millis of that fake-UTC instant. Doing the
 * "now" and "target cutoff" calculation through the same fake-UTC space
 * cancels out the real UTC offset, so the millisecond delta between the two
 * is the real wall-clock duration until the cutoff in that timezone.
 */
function zonedWallClockAsUtcMillis(timezone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0)
  let hour = get('hour')
  if (hour === 24) hour = 0 // some ICU implementations emit "24" for midnight with hour12:false
  return Date.UTC(get('year'), get('month') - 1, get('day'), hour, get('minute'), get('second'))
}

/** Milliseconds from now until the next occurrence of `HH:mm` in `timezone`. */
function computeMsUntilNextCutoff(time: string, timezone: string): number {
  const [hh, mm] = time.split(':').map(Number)
  const now = new Date()
  const nowZoned = zonedWallClockAsUtcMillis(timezone, now)
  const nowZonedDate = new Date(nowZoned)
  let target = Date.UTC(
    nowZonedDate.getUTCFullYear(),
    nowZonedDate.getUTCMonth(),
    nowZonedDate.getUTCDate(),
    hh,
    mm,
    0
  )
  if (target <= nowZoned) {
    target += 24 * 60 * 60 * 1000
  }
  return target - nowZoned
}

async function runAutoLogout(navigate: (path: string) => void): Promise<void> {
  await authApi.logout().catch(() => {})
  useAuthStore.getState().logout()
  navigate('/login')
  toast.info("You've been logged out automatically per your organization's policy.")
}

/**
 * Mount ONLY inside the authenticated shell (AppLayout) — never on public
 * routes. Reads `user.autoLogout` (surfaced via /auth/me and /auth/login,
 * NOT via GET /organization — every authenticated role must be able to read
 * the cutoff even without org:read) and schedules a single deterministic
 * timer to the next occurrence of the configured cutoff. No polling.
 */
export function useAutoLogout(): void {
  const navigate = useNavigate()
  const enabled = useAuthStore((s) => s.user?.autoLogout?.enabled ?? false)
  const time = useAuthStore((s) => s.user?.autoLogout?.time ?? null)
  const timezone = useAuthStore((s) => s.user?.autoLogout?.timezone ?? 'Asia/Kolkata')
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!enabled || !time) return

    let cancelled = false

    const clear = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }

    const schedule = () => {
      if (cancelled) return
      clear()
      const delay = computeMsUntilNextCutoff(time, timezone)
      if (delay <= 0) {
        void runAutoLogout(navigate)
        return
      }
      if (delay > MAX_TIMEOUT_MS) {
        timeoutRef.current = setTimeout(schedule, MAX_TIMEOUT_MS)
        return
      }
      timeoutRef.current = setTimeout(() => void runAutoLogout(navigate), delay)
    }

    schedule()

    // A laptop asleep past the cutoff won't fire a suspended setTimeout on
    // wake — recompute (and fire immediately if already past) on focus/wake.
    const handleWake = () => schedule()
    window.addEventListener('focus', handleWake)
    document.addEventListener('visibilitychange', handleWake)

    return () => {
      cancelled = true
      clear()
      window.removeEventListener('focus', handleWake)
      document.removeEventListener('visibilitychange', handleWake)
    }
  }, [enabled, time, timezone, navigate])
}
