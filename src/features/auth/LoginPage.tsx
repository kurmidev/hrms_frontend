import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AtSign, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { getApiErrorMessage } from '@/lib/utils'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type FormValues = z.infer<typeof schema>

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values: FormValues) => {
    setLoading(true)
    try {
      const result = await authApi.login(values)
      setAuth(result.user, result.accessToken, result.refreshToken)
      if (result.user.mustChangePassword) {
        navigate('/change-password')
      } else {
        navigate('/')
      }
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, 'Login failed. Please try again.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-primary">Welcome back!</h2>
        <p className="text-sm text-muted-foreground mt-2">Sign in to continue to your HR portal</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="sr-only">
            Email address
          </Label>
          <div className="relative">
            <Input
              id="email"
              type="email"
              placeholder="Email address / Mobile no."
              autoComplete="email"
              className="h-12 rounded-full border-0 bg-muted pl-5 pr-11 text-sm"
              {...register('email')}
            />
            <AtSign className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          </div>
          {errors.email && <p className="text-xs text-destructive px-2">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="sr-only">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              autoComplete="current-password"
              className="h-12 rounded-full border-0 bg-muted pl-5 pr-11 text-sm"
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive px-2">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          className="w-full h-12 rounded-full text-base font-bold"
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Login
        </Button>
      </form>

      <div className="mt-6 text-center">
        <Link
          to="/login/otp"
          className="text-sm font-semibold text-primary hover:underline"
        >
          Forgot password? Sign in with OTP instead
        </Link>
      </div>
    </div>
  )
}
