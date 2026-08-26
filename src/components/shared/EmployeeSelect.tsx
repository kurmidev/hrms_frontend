import { useQuery } from '@tanstack/react-query'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { employeesApi } from '@/api/employees.api'
import type { Employee } from '@/types/employee.types'

interface Props {
  value: string
  onValueChange: (id: string) => void
  placeholder?: string
  className?: string
}

// Picker for "act on behalf of an employee" flows (e.g. a manager assigning
// a todo, or an admin account with no employee record of its own applying a
// loan for someone). Requires `employee:read` server-side — every seeded
// role that also holds an approve/manage permission for these flows already
// has `employee:read` too, so this is safe to reuse as-is.
export function EmployeeSelect({ value, onValueChange, placeholder = 'Select employee', className }: Props) {
  const { data } = useQuery({
    queryKey: ['employees', 'picker'],
    queryFn: () => employeesApi.list({ limit: 500, status: 'ACTIVE' }),
  })
  const employees: Employee[] = (data as { data?: Employee[] })?.data ?? []

  return (
    <Select
      items={Object.fromEntries(employees.map((e) => [e.id, `${e.firstName} ${e.lastName} (${e.empCode})`]))}
      value={value}
      onValueChange={(v) => onValueChange(v ?? '')}
    >
      <SelectTrigger className={className ?? 'w-full'}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {employees.map((e) => (
          <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.empCode})</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
