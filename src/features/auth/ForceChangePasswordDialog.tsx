import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, ShieldAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'At least 8 characters')
      .regex(/[A-Z]/, 'Must contain uppercase letter')
      .regex(/[0-9]/, 'Must contain a number')
      .regex(/[^a-zA-Z0-9]/, 'Must contain a special character'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

type FormValues = z.infer<typeof schema>

export function ForceChangePasswordDialog() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [show, setShow] = useState({ current: false, new: false, confirm: false })

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      toast.success('Password updated. Please log in again.')
      logout()
      navigate('/login')
    } catch {
      toast.error('Failed to change password. Check your current password.')
    } finally {
      setLoading(false)
    }
  }

  const toggle = (field: 'current' | 'new' | 'confirm') =>
    setShow((prev) => ({ ...prev, [field]: !prev[field] }))

  return (
    <Dialog open={!!user?.mustChangePassword} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-md [&>button[aria-label='Close']]:hidden"
      >
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30">
              <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-lg">Password Change Required</DialogTitle>
          </div>
          <DialogDescription>
            Your account requires a password update before you can continue. Please choose a strong
            new password.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {(
            [
              { field: 'currentPassword', label: 'Current Password', key: 'current' },
              { field: 'newPassword', label: 'New Password', key: 'new' },
              { field: 'confirmPassword', label: 'Confirm New Password', key: 'confirm' },
            ] as const
          ).map(({ field, label, key }) => (
            <div key={field} className="space-y-1.5">
              <Label htmlFor={`force-${field}`}>{label}</Label>
              <div className="relative">
                <Input
                  id={`force-${field}`}
                  type={show[key] ? 'text' : 'password'}
                  {...register(field)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => toggle(key)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {show[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors[field] && (
                <p className="text-xs text-destructive">{errors[field]?.message}</p>
              )}
            </div>
          ))}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update Password
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
