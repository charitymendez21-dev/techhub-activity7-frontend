import { api } from './client'

export type DashboardData = {
  generated_at: string
  widgets: {
    total_users: number
    total_products: number
    total_orders: number
    sales_today: number
    sales_this_month: number
    low_stock_count: number
    pending_orders_count: number
  }
  low_stock_products: Array<{
    id: number
    name: string
    sku: string
    stock: number
    threshold: number
    thumbnail: string | null
  }>
  monthly_sales: Array<{ label: string; total: number }>
  orders_per_month: Array<{ label: string; count: number }>
  top_products: Array<{ id: number; name: string; quantity: number; revenue: number }>
  recent_orders: Array<{
    id: number
    order_number: string
    customer: string | null
    status: string
    grand_total: number
    created_at: string | null
  }>
  revenue_note: string
}

export const dashboardApi = {
  get: async (months: number) =>
    (await api.get<{ data: DashboardData }>('/admin/dashboard', { params: { months } })).data.data,
}
