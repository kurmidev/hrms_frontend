import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRef } from 'react'
import { Loader2, Building2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { organizationsApi } from '@/api/organizations.api'
import { usePermission } from '@/hooks/usePermission'
import { useAuthStore } from '@/store/auth.store'
import { toast } from 'sonner'
import { getApiErrorMessage } from '@/lib/utils'

const MAX_LOGO_SIZE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  address: z.string().optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
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

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: {
      name: org?.name ?? '',
      email: org?.email ?? '',
      phone: org?.phone ?? '',
      website: org?.website ?? '',
      address: org?.address ?? '',
      logoUrl: org?.logoUrl ?? '',
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormValues) => organizationsApi.update(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['organization'] })
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
    </div>
  )
}
