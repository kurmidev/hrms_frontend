import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { authApi } from '@/api/auth.api'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'

const phoneSchema = z.object({ phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number') })
const otpSchema = z.object({ otp: z.string().length(6, 'OTP must be 6 digits') })
type PhoneValues = z.infer<typeof phoneSchema>
type OtpValues = z.infer<typeof otpSchema>

export function OtpPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const phoneForm = useForm<PhoneValues>({ resolver: zodResolver(phoneSchema) })
  const otpForm = useForm<OtpValues>({ resolver: zodResolver(otpSchema) })

  const sendOtp = async (values: PhoneValues) => {
    setLoading(true)
    try {
      await authApi.sendOtp({ phone: values.phone })
      setPhone(values.phone)
      setStep('otp')
      toast.success('OTP sent to your mobile number')
    } catch {
      toast.error('Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (values: OtpValues) => {
    setLoading(true)
    try {
      const result = await authApi.verifyOtp({ phone, otp: values.otp })
      setAuth(result.user, result.accessToken, result.refreshToken)
      navigate(result.user.mustChangePassword ? '/change-password' : '/')
    } catch {
      toast.error('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">
          {step === 'phone' ? 'Sign in with OTP' : 'Enter OTP'}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {step === 'phone' ? 'Enter your registered mobile number' : `OTP sent to +91 ${phone}`}
        </p>
      </div>

      {step === 'phone' ? (
        <form onSubmit={phoneForm.handleSubmit(sendOtp)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Mobile number</Label>
            <Input id="phone" placeholder="9876543210" {...phoneForm.register('phone')} />
            {phoneForm.formState.errors.phone && (
              <p className="text-xs text-destructive">{phoneForm.formState.errors.phone.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send OTP
          </Button>
        </form>
      ) : (
        <form onSubmit={otpForm.handleSubmit(verifyOtp)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="otp">6-digit OTP</Label>
            <Input id="otp" placeholder="123456" maxLength={6} {...otpForm.register('otp')} />
            {otpForm.formState.errors.otp && (
              <p className="text-xs text-destructive">{otpForm.formState.errors.otp.message}</p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify OTP
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => setStep('phone')}>
            Change number
          </Button>
        </form>
      )}
    </div>
  )
}
