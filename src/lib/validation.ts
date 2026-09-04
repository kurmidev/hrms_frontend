import { z } from 'zod'

// Canonical mobile-number rule for this codebase: exactly 10 numeric digits.
// Mirrors the backend's shared `@Matches(/^\d{10}$/)` constraint applied to
// every genuine mobile field (employee.phone, emergencyContact.phone/
// alternatePhone, onboarding candidate phone, etc). Do NOT use this for
// landline/free-text contact fields (e.g. Organization.phone) or the
// India-specific OTP flows, which intentionally keep the stricter
// `^[6-9]\d{9}$` pattern already enforced by `auth/dto/otp.dto.ts`.
export const MOBILE_REGEX = /^\d{10}$/
export const MOBILE_ERROR_MESSAGE = 'Mobile number must be exactly 10 digits'

// Required mobile field.
export const mobileSchema = z.string().regex(MOBILE_REGEX, MOBILE_ERROR_MESSAGE)

// Optional mobile field — empty/undefined is fine, but if a value is present
// it must be exactly 10 digits (an empty string must not trip the regex).
export const optionalMobileSchema = z
  .string()
  .optional()
  .refine((v) => !v || MOBILE_REGEX.test(v), { message: MOBILE_ERROR_MESSAGE })

/**
 * Strip everything but digits and cap at 10 characters. Wire this into every
 * mobile `<Input>`'s onChange (or the DOM event before handing it to
 * react-hook-form's own onChange) so paste + keypress both yield a value
 * that can only ever be ≤10 digits, numbers only.
 */
export function sanitizeMobileInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10)
}
