import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { organizationsApi } from '@/api/organizations.api'
import { toast } from 'sonner'

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
  const { data: org, isLoading } = useQuery({
    queryKey: ['organization'],
    queryFn: organizationsApi.get,
  })

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
    onError: () => toast.error('Failed to update organization.'),
  })

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
                    <Input id={id} placeholder={placeholder} {...register(id as keyof FormValues)} />
                    {errors[id as keyof FormValues] && (
                      <p className="text-xs text-destructive">{errors[id as keyof FormValues]?.message}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <Input id="address" placeholder="123 Main Street, City, State" {...register('address')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input id="logoUrl" placeholder="https://cdn.company.com/logo.png" {...register('logoUrl')} />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={!isDirty || isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
