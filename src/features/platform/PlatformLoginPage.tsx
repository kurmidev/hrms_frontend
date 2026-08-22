import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate } from 'react-router-dom'
import { usePlatformAuthStore } from '@/store/platform-auth.store'
import { platformAuthApi } from '@/api/platform-auth.api'
import { toast } from 'sonner'

const schema = z.object({ email: z.string().email(), password: z.string().min(1) })
type FormValues = z.infer<typeof schema>

export function PlatformLoginPage() {
  const { setAuth, isAuthenticated } = usePlatformAuthStore()
  const navigate = useNavigate()
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (isAuthenticated) navigate('/platform/dashboard', { replace: true })
  }, [isAuthenticated, navigate])

  const onSubmit = async (data: FormValues) => {
    try {
      const result = await platformAuthApi.login(data.email, data.password)
      setAuth(result.admin, result.token)
      navigate('/platform/dashboard')
    } catch {
      toast.error('Invalid credentials')
    }
  }

  return (
    <div className="platform-shell min-h-screen bg-[var(--platform-bg)] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-[var(--platform-surface)] rounded-2xl p-8 border border-[var(--platform-border)] shadow-2xl">
        <div className="flex flex-col items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[var(--platform-accent)] rounded-xl flex items-center justify-center">
            <span className="text-white text-xl font-bold">H</span>
          </div>
          <div className="text-center">
            <h1 className="text-xl font-bold text-white">Platform Admin</h1>
            <p className="text-[var(--platform-muted)] text-sm mt-1">HRMS Administration Portal</p>
          </div>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm text-[var(--platform-text-soft)] mb-1.5">Email</label>
            <input
              {...register('email')}
              type="email"
              className="w-full bg-[var(--platform-raised)] border border-[var(--platform-input-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--platform-accent)] placeholder:text-[var(--platform-muted)]"
              placeholder="admin@platform.com"
            />
            {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm text-[var(--platform-text-soft)] mb-1.5">Password</label>
            <input
              {...register('password')}
              type="password"
              className="w-full bg-[var(--platform-raised)] border border-[var(--platform-input-border)] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[var(--platform-accent)] placeholder:text-[var(--platform-muted)]"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[var(--platform-accent)] hover:bg-[var(--platform-accent-hover)] disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}
