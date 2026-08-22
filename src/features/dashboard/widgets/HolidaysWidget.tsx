import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { CalendarDays, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { leaveApi } from '@/api/leave.api'
import type { Holiday } from '@/types/leave.types'
import { formatDate } from '@/lib/utils'

const MAX_ROWS = 5

export function HolidaysWidget() {
  const year = new Date().getFullYear()
  const { data, isLoading } = useQuery({
    queryKey: ['leave-holidays', year],
    queryFn: () => leaveApi.getHolidays(year),
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // GET /leave/holidays returns the paginated envelope ({ data: Holiday[], meta })
  // like every other list endpoint — unwrap() only strips the outer response
  // envelope, so the inner `.data` array must still be pulled out here. A bare
  // `data ?? []` treats the `{ data, meta }` object itself as the array and
  // crashes the whole dashboard (`.filter is not a function`) the first time
  // this widget renders with a non-empty holiday list.
  const holidays = (data as { data?: Holiday[] })?.data ?? []

  const upcoming = holidays
    .filter((h) => new Date(h.date) >= today)
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, MAX_ROWS)

  return (
    <Card className="shadow-sm h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-primary" />
          Holidays
        </CardTitle>
        <Link to="/leave/holidays" className="flex items-center gap-1 text-xs font-medium text-primary hover:text-primary/80">
          View all <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </div>
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No upcoming holidays.</p>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="pb-2 font-medium">Holiday Name</th>
                  <th className="pb-2 font-medium text-right w-28">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {upcoming.map((holiday) => (
                  <tr key={holiday.id}>
                    <td className="py-2 pr-2 text-foreground truncate">
                      {holiday.name}
                      <span className="ml-2 inline-block text-[10px] font-medium text-muted-foreground uppercase align-middle">
                        {holiday.type}
                      </span>
                    </td>
                    <td className="py-2 text-right text-muted-foreground whitespace-nowrap">{formatDate(holiday.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
