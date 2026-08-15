export interface DashboardWidget {
  id?: string
  widgetType: string
  title: string
  position: number
  colSpan: 1 | 2 | 3 | 4
  rowSpan?: 1 | 2
  config?: Record<string, unknown>
}

export interface DashboardConfig {
  id: string
  name: string
  roleName: string | null
  userId: string | null
  isDefault: boolean
  widgets: DashboardWidget[]
}
