import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date | null | undefined, fmt = 'dd MMM yyyy'): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, fmt)
}

export function formatDateTime(date: string | Date | null | undefined): string {
  return formatDate(date, 'dd MMM yyyy, HH:mm')
}

export function formatCurrency(amount: number | null | undefined, currency = 'INR'): string {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getInitials(firstName: string, lastName?: string): string {
  const f = firstName?.[0]?.toUpperCase() ?? ''
  const l = lastName?.[0]?.toUpperCase() ?? ''
  return f + l || '?'
}

export function getFullName(firstName: string, lastName: string): string {
  return `${firstName} ${lastName}`.trim()
}

export function truncate(str: string, length: number): string {
  return str.length > length ? `${str.slice(0, length)}…` : str
}

/**
 * Extract the human-readable message from a failed API call.
 *
 * `HttpExceptionFilter` (backend/src/common/filters/http-exception.filter.ts)
 * always puts the real, business-rule-specific message on the top-level
 * `message` field of the error envelope (`{ status: false, message, data }`)
 * — e.g. a `BadRequestException('This leave policy allows a maximum of 1
 * consecutive days')` lands at `error.response.data.message`. Several
 * mutation `onError` handlers previously discarded this entirely in favor of
 * a generic toast ("Failed to submit leave application."), which silently
 * hid the exact reason a request was rejected (e.g. the Casual Leave
 * max-1-consecutive-day rule) from the user. Always prefer this over a
 * hardcoded fallback string when the backend's message is actionable.
 */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === 'object' &&
    'response' in error &&
    error.response &&
    typeof error.response === 'object' &&
    'data' in error.response
  ) {
    const data = (error.response as { data?: { message?: unknown } }).data
    if (typeof data?.message === 'string') return data.message
    if (Array.isArray(data?.message) && typeof data.message[0] === 'string') {
      return data.message.join(' ')
    }
  }
  return fallback
}
