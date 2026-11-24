import { api } from './client'
import type { ApiResource } from '../types'

export type CheckoutSummary = {
  subtotal: string
  shipping_fee: string
  tax: string
  grand_total: string
  currency: string
  items: number
}

export type CheckoutDetails = {
  shipping_name: string
  shipping_address: string
  contact_number: string
  payment_method: 'cod'
  notes?: string
}

export type Order = {
  id: number
  order_number: string
  status: string
  payment_status: string
  payment_method: string
  shipping_name: string
  shipping_address: string
  contact_number: string
  notes: string | null
  subtotal: string
  shipping_fee: string
  tax: string
  grand_total: string
  items: Array<{
    id: number
    product_id: number | null
    product_name: string
    sku: string | null
    image: string | null
    unit_price: string
    quantity: number
    line_total: string
  }>
}

export const checkoutApi = {
  async summary(): Promise<CheckoutSummary> {
    return (await api.get<ApiResource<CheckoutSummary>>('/checkout/summary')).data.data
  },
  async place(details: CheckoutDetails): Promise<Order> {
    return (await api.post<ApiResource<Order>>('/checkout', details)).data.data
  },
  async order(id: string): Promise<Order> {
    return (await api.get<ApiResource<Order>>(`/orders/${id}`)).data.data
  },
}
