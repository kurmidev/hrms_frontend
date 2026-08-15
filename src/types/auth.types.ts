export interface AuthUser {
  id: string
  email: string
  phone: string | null
  isActive: boolean
  mustChangePassword: boolean
  lastLoginAt: string | null
  employee: {
    id: string
    firstName: string
    lastName: string
    profilePhotoUrl: string | null
    empCode: string
    departmentId: string | null
    designationId: string | null
  } | null
  roles: Array<{ id: string; name: string }>
  permissions: string[]
  organizationId: string
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
