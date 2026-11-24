import { api } from './client'
import type { Paginated } from './admin'

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'paid' | 'unpaid' | 'refunded'

export type OrderItem = {
  id: number
  product_id: number
  product_name: string
  sku: string | null
  product_slug: string | null
  image: string | null
  unit_price: string
  quantity: number
  line_total: string | null
}

export type OrderHistoryEntry = {
  id: number
  from_status: OrderStatus | null
  to_status: OrderStatus
  changed_by: { id: number; name: string } | null
  note: string | null
  created_at: string
}

export type Order = {
  id: number
  order_number: string
  status: OrderStatus
  payment_status: PaymentStatus
  payment_method: string
  shipping_name: string | null
  shipping_address: string | null
  contact_number: string | null
  notes: string | null
  shipped_at: string | null
  delivered_at: string | null
  cancelled_at: string | null
  subtotal: string
  shipping_fee: string
  tax: string
  grand_total: string
  total: string
  item_count: number
  preview_image: string | null
  can_cancel: boolean
  items: OrderItem[]
  status_history: OrderHistoryEntry[]
  created_at: string
}

export type AdminOrder = Order & {
  customer: { id: number; name: string; email: string } | null
  allowed_next_statuses: OrderStatus[]
}

export type OrderFilters = {
  status?: OrderStatus | ''
  page?: number
  per_page?: number
}

export const ordersApi = {
  async list(params: OrderFilters): Promise<Paginated<Order>> {
    return (await api.get<Paginated<Order>>('/orders', {
      params: { ...params, status: params.status || undefined },
    })).data
  },
  async detail(id: number | string): Promise<Order> {
    return (await api.get<{ data: Order }>(`/orders/${id}`)).data.data
  },
  async cancel(id: number, reason?: string): Promise<Order> {
    return (await api.post<{ data: Order }>(`/orders/${id}/cancel`, { reason })).data.data
  },
}
