// Matches `AuthService.login()`/`getMe()` exactly (backend/src/modules/auth/auth.service.ts).
// Previous shape declared `isActive`/`lastLoginAt` (never sent by either endpoint) and
// `employee.departmentId`/`employee.designationId` (the real response sends the resolved
// `department`/`designation` NAME strings instead, plus no such IDs) — the department/id
// mismatch silently rendered "—" for every employee's own department/designation on
// `ProfilePage.tsx`, even when the data was present in the API response the whole time.
export interface AuthUser {
  id: string
  email: string
  phone: string | null
  mustChangePassword: boolean
  employee: {
    id: string
    firstName: string
    lastName: string
    profilePhotoUrl: string | null
    empCode: string
    department: string | null
    designation: string | null
    status: 'PRE_BOARDING' | 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'EXITED'
  } | null
  roles: Array<{ id: string; name: string }>
  permissions: string[]
  organizationId: string
  organizationName?: string | null
  organizationLogoUrl?: string | null
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
  expiresIn: number
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface OtpRequest {
  phone: string
}

export interface OtpVerify {
  phone: string
  otp: string
}

export interface ChangePasswordPayload {
  currentPassword: string
  newPassword: string
}

export interface ResetPasswordPayload {
  token: string
  newPassword: string
}
