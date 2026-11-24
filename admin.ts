import axios from 'axios'
import { api } from './client'
import type { AdminOrder, OrderStatus } from './orders'

export type Paginated<T> = {
  data: T[]
  links: { first: string | null; last: string | null; prev: string | null; next: string | null }
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

export type Category = {
  id: number
  name: string
  slug: string
  description: string | null
  image_url: string | null
  status: 'active' | 'inactive'
  products_count: number
  deleted_at: string | null
}

export type Brand = { id: number; name: string; slug: string }

export type ProductImage = {
  id: number
  url: string | null
  is_primary: boolean
  sort_order: number
}

export type Product = {
  id: number
  name: string
  slug: string
  sku: string
  category_id: number
  brand_id: number | null
  category: Pick<Category, 'id' | 'name' | 'slug'>
  brand: Brand | null
  description: string | null
  price: string
  sale_price: string | null
  stock_quantity: number
  low_stock_threshold: number
  is_low_stock: boolean
  is_featured: boolean
  status: 'active' | 'inactive'
  images: ProductImage[]
  deleted_at: string | null
}

export type ListParams = Record<string, string | number | boolean | undefined>
export type AdminOrderParams = ListParams & {
  search?: string
  status?: OrderStatus | ''
  date_from?: string
  date_to?: string
  payment_status?: string
  sort?: 'newest' | 'oldest' | 'total_desc' | 'total_asc'
  page?: number
  per_page?: number
}

const multipart = { headers: { 'Content-Type': 'multipart/form-data' } }

export const adminApi = {
  categories: async (params: ListParams) =>
    (await api.get<Paginated<Category>>('/admin/categories', { params })).data,
  createCategory: async (data: FormData) =>
    (await api.post<{ data: Category }>('/admin/categories', data, multipart)).data.data,
  updateCategory: async (id: number, data: FormData) => {
    data.set('_method', 'PUT')
    return (await api.post<{ data: Category }>(`/admin/categories/${id}`, data, multipart)).data.data
  },
  deleteCategory: async (id: number) => api.delete(`/admin/categories/${id}`),
  restoreCategory: async (id: number) =>
    (await api.patch<{ data: Category }>(`/admin/categories/${id}/restore`)).data.data,
  brands: async (params: ListParams = {}) =>
    (await api.get<Paginated<Brand>>('/admin/brands', { params })).data,
  createBrand: async (name: string) =>
    (await api.post<{ data: Brand }>('/admin/brands', { name })).data.data,
  products: async (params: ListParams) =>
    (await api.get<Paginated<Product>>('/admin/products', { params })).data,
  product: async (id: number, signal?: AbortSignal) =>
    (await api.get<{ data: Product }>(`/admin/products/${id}`, { signal })).data.data,
  createProduct: async (data: FormData) =>
    (await api.post<{ data: Product }>('/admin/products', data, multipart)).data.data,
  updateProduct: async (id: number, data: FormData) => {
    data.set('_method', 'PUT')
    return (await api.post<{ data: Product }>(`/admin/products/${id}`, data, multipart)).data.data
  },
  deleteProduct: async (id: number) => api.delete(`/admin/products/${id}`),
  restoreProduct: async (id: number) =>
    (await api.patch<{ data: Product }>(`/admin/products/${id}/restore`)).data.data,
  deleteProductImage: async (productId: number, imageId: number) =>
    api.delete(`/admin/products/${productId}/images/${imageId}`),
  setPrimaryImage: async (productId: number, imageId: number) =>
    (await api.patch<{ data: ProductImage }>(`/admin/products/${productId}/images/${imageId}/primary`))
      .data.data,
  orders: async (params: AdminOrderParams) =>
    (await api.get<Paginated<AdminOrder>>('/admin/orders', { params })).data,
  order: async (id: number | string) =>
    (await api.get<{ data: AdminOrder }>(`/admin/orders/${id}`)).data.data,
  orderStatusCounts: async () =>
    (await api.get<{ data: Record<OrderStatus, number> }>('/admin/orders/status-counts')).data.data,
  updateOrderStatus: async (id: number, status: OrderStatus, note?: string) =>
    (await api.patch<{ data: AdminOrder }>(`/admin/orders/${id}/status`, { status, note })).data.data,
}

export function getFieldErrors(error: unknown): Record<string, string> {
  if (!axios.isAxiosError<{ errors?: Record<string, string[]> }>(error)) return {}

  return Object.fromEntries(
    Object.entries(error.response?.data?.errors ?? {}).map(([field, messages]) => [
      field.replace(/\.\d+$/, ''),
      messages[0] ?? 'Invalid value',
    ]),
  )
}

export function getAdminError(error: unknown): string {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? 'The request could not be completed.'
  }
  return 'An unexpected error occurred.'
}
