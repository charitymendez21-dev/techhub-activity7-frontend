import { api } from './client'
import type { Paginated } from './admin'

export type AdminUser = {
  id: number
  name: string
  email: string
  role: 'customer' | 'admin'
  is_active: boolean
  avatar_url: string | null
  created_at: string | null
  orders_count: number
  total_spent: number
  deleted_at: string | null
}

export type UserListParams = Record<string, string | number | undefined>

export const usersApi = {
  list: async (params: UserListParams) =>
    (await api.get<Paginated<AdminUser>>('/admin/users', { params })).data,
  get: async (id: number) =>
    (await api.get<{ data: AdminUser }>(`/admin/users/${id}`)).data.data,
  create: async (body: Record<string, unknown>) =>
    (await api.post<{ data: AdminUser }>('/admin/users', body)).data.data,
  update: async (id: number, body: Record<string, unknown>) =>
    (await api.put<{ data: AdminUser }>(`/admin/users/${id}`, body)).data.data,
  toggleActive: async (id: number, is_active: boolean) =>
    (await api.patch<{ data: AdminUser }>(`/admin/users/${id}/toggle-active`, { is_active })).data.data,
  remove: async (id: number) => api.delete(`/admin/users/${id}`),
  restore: async (id: number) =>
    (await api.patch<{ data: AdminUser }>(`/admin/users/${id}/restore`)).data.data,
}
