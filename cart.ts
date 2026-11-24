import { api } from './client'
import type { ApiResource } from '../types'

export type CartItem = {
  id: number
  product_id: number
  name: string
  slug: string | null
  image: string | null
  unit_price: string
  quantity: number
  line_total: string
  stock_available: number
  low_stock_threshold: number
  is_available: boolean
}

export type Cart = {
  items: CartItem[]
  subtotal: string
  item_count: number
}

export const cartApi = {
  async get(): Promise<Cart> {
    return (await api.get<ApiResource<Cart>>('/cart')).data.data
  },
  async add(productId: number, quantity: number): Promise<Cart> {
    return (await api.post<ApiResource<Cart>>('/cart/items', {
      product_id: productId,
      quantity,
    })).data.data
  },
  async update(itemId: number, quantity: number): Promise<Cart> {
    return (await api.patch<ApiResource<Cart>>(`/cart/items/${itemId}`, { quantity })).data.data
  },
  async remove(itemId: number): Promise<Cart> {
    return (await api.delete<ApiResource<Cart>>(`/cart/items/${itemId}`)).data.data
  },
  async clear(): Promise<Cart> {
    return (await api.delete<ApiResource<Cart>>('/cart')).data.data
  },
}
