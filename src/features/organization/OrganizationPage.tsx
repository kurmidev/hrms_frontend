import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRef } from 'react'
import { Loader2, Building2, Upload, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { organizationsApi } from '@/api/organizations.api'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

// A reasonable, non-exhaustive short list — the backend accepts any valid
// IANA zone, this is just what the picker offers by default.
const TIMEZONE_OPTIONS = [
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'Asia/Dubai', label: 'Asia/Dubai (GST)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
  { value: 'America/New_York', label: 'America/New_York (ET)' },
  { value: 'America/Chicago', label: 'America/Chicago (CT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PT)' },
  { value: 'UTC', label: 'UTC' },
]

const HH_MM_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/

const schema = z
  .object({
    name: z.string().min(1),
    email: z.string().email().optional().or(z.literal('')),
    phone: z.string().optional(),
    website: z.string().url().optional().or(z.literal('')),
    address: z.string().optional(),
    logoUrl: z.string().url().optional().or(z.literal('')),
    autoLogoutEnabled: z.boolean(),
    autoLogoutTime: z.string().optional(),
    autoLogoutTimezone: z.string().min(1),
  })
  .refine((v) => !v.autoLogoutEnabled || (!!v.autoLogoutTime && HH_MM_REGEX.test(v.autoLogoutTime)), {
    message: 'A valid time (HH:mm) is required when auto-logout is enabled',
    path: ['autoLogoutTime'],
  })
type FormValues = z.infer<typeof schema>

export function OrganizationPage() {
  const qc = useQueryClient()
  const canView = usePermission('org:read')
  const canUpdate = usePermission('org:update')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { data: org, isLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: organizationsApi.get,
    enabled: canView,
  })

  const { mutate: uploadLogo, isPending: isUploadingLogo } = useMutation({
    mutationFn: (file: File) => organizationsApi.uploadLogo(file),
    onSuccess: (updatedOrg) => {
      qc.invalidateQueries({ queryKey: ['organization'] })
      useAuthStore.getState().setOrganizationLogoUrl(updatedOrg.logoUrl ?? null)
      toast.success('Organization logo updated.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to upload logo.')),
  })

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      toast.error('Please upload a PNG, JPEG, WEBP, or SVG image.')
      return
    }
    if (file.size > MAX_LOGO_SIZE_BYTES) {
      toast.error('Logo image must be 5MB or smaller.')
      return
    }
    uploadLogo(file)
  }

  const { register, handleSubmit, watch, setValue, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema) as Resolver<FormValues>,
    values: {
      name: org?.name ?? '',
      email: org?.email ?? '',
      phone: org?.phone ?? '',
      website: org?.website ?? '',
      address: org?.address ?? '',
      logoUrl: org?.logoUrl ?? '',
      autoLogoutEnabled: org?.autoLogoutEnabled ?? false,
      autoLogoutTime: org?.autoLogoutTime ?? '',
      autoLogoutTimezone: org?.autoLogoutTimezone ?? 'Asia/Kolkata',
    },
  })

  const autoLogoutEnabled = watch('autoLogoutEnabled')
  const autoLogoutTimezone = watch('autoLogoutTimezone')

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormValues) => {
      const { autoLogoutEnabled: enabled, autoLogoutTime, autoLogoutTimezone: tz, ...rest } = data
      return organizationsApi.update({
        ...rest,
        autoLogoutEnabled: enabled,
        autoLogoutTimezone: tz,
        // Only send a time when enabling — avoids the 400 when disabling
        // with a stale/empty time value still sitting in the form.
        ...(enabled ? { autoLogoutTime } : {}),
      })
    },
    onSuccess: (updatedOrg) => {
      qc.invalidateQueries({ queryKey: ['organization'] })
      // Update the auth store live so a mounted useAutoLogout picks up the
      // new cutoff immediately, without waiting for the next login/refresh.
      const currentUser = useAuthStore.getState().user
      if (currentUser) {
        useAuthStore.setState({
          user: {
            ...currentUser,
            autoLogout: {
              enabled: updatedOrg.autoLogoutEnabled,
              time: updatedOrg.autoLogoutTime,
              timezone: updatedOrg.autoLogoutTimezone,
            },
          },
        })
      }
      toast.success('Organization profile updated.')
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Failed to update organization.')),
  })

  if (!canView) {
    return (
      <div className="max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Organization Profile</h1>
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card py-16 text-center text-sm text-muted-foreground">
          You do not have permission to view the organization profile.
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Organization Profile</h1>
          <p className="text-sm text-muted-foreground">Manage your organization settings</p>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Basic Information</CardTitle>
          <CardDescription>Update your organization name and contact details</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <form onSubmit={handleSubmit((v) => mutate(v))} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { id: 'name', label: 'Organization Name *', placeholder: 'Acme Corp' },
                  { id: 'email', label: 'Email', placeholder: 'contact@company.com' },
                  { id: 'phone', label: 'Phone', placeholder: '+91 98765 43210' },
                  { id: 'website', label: 'Website', placeholder: 'https://company.com' },
                ].map(({ id, label, placeholder }) => (
                  <div key={id} className="space-y-1.5">
                    <Label htmlFor={id}>{label}</Label>
                    <Input id={id} placeholder={placeholder} readOnly={!canUpdate} {...register(id as keyof FormValues)} />
                    {errors[id as keyof FormValues] && (
                      <p className="text-xs text-destructive">{errors[id as keyof FormValues]?.message}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="123 Main Street, City, State" readOnly={!canUpdate} {...register('address')} />
              </div>
              <div className="space-y-1.5">
                <Label>Organization Logo</Label>
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg border border-border bg-muted/30 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {org?.logoUrl ? (
                      <img src={org.logoUrl} alt={org.name} className="w-full h-full object-contain" />
                    ) : (
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  {canUpdate && (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoFileChange}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploadingLogo}
                        onClick={() => fileInputRef.current?.click()}
                      >
                        {isUploadingLogo ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {isUploadingLogo ? 'Uploading…' : 'Upload Logo'}
                      </Button>
                      <p className="mt-1 text-xs text-muted-foreground">PNG, JPEG, WEBP, or SVG, up to 5MB.</p>
                    </div>
                  )}
                </div>
              </div>
              {canUpdate && (
                <div className="space-y-1.5">
                  <Label htmlFor="logoUrl">Logo URL (advanced)</Label>
                  <Input id="logoUrl" placeholder="https://cdn.company.com/logo.png" {...register('logoUrl')} />
                  {errors.logoUrl && <p className="text-xs text-destructive">{errors.logoUrl.message}</p>}
                </div>
              )}
              {canUpdate && (
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={!isDirty || isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Session &amp; Security</CardTitle>
          </div>
          <CardDescription>
            Automatically sign employees out at a fixed time of day, regardless of activity.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <form onSubmit={handleSubmit((v) => mutate(v))} className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label htmlFor="autoLogoutEnabled">Auto-logout employees at a fixed time</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Employees who have not manually logged out will be signed out automatically once this time is reached.
                  </p>
                </div>
                <Switch
                  id="autoLogoutEnabled"
                  checked={autoLogoutEnabled}
                  disabled={!canUpdate}
                  onCheckedChange={(checked) => setValue('autoLogoutEnabled', checked === true, { shouldDirty: true })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="autoLogoutTime">Cutoff Time *</Label>
                  <Input
                    id="autoLogoutTime"
                    type="time"
                    disabled={!canUpdate || !autoLogoutEnabled}
                    {...register('autoLogoutTime')}
                  />
                  {errors.autoLogoutTime && <p className="text-xs text-destructive">{errors.autoLogoutTime.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Timezone</Label>
                  <Select
                    items={Object.fromEntries(TIMEZONE_OPTIONS.map((t) => [t.value, t.label]))}
                    value={autoLogoutTimezone ?? 'Asia/Kolkata'}
                    onValueChange={(v) => setValue('autoLogoutTimezone', v ?? 'Asia/Kolkata', { shouldDirty: true })}
                    disabled={!canUpdate || !autoLogoutEnabled}
                  >
                    <SelectTrigger className="w-full"><SelectValue placeholder="Select timezone" /></SelectTrigger>
                    <SelectContent>
                      {TIMEZONE_OPTIONS.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {canUpdate && (
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={!isDirty || isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Save Changes
                  </Button>
                </div>
              )}
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
