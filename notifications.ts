import { api } from './client'
import type { Paginated } from './products'

export type ShopNotification = {
  id: string
  type: string
  title: string
  message: string
  link: string
  data: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export const notificationsApi = {
  list: async (params: { unread?: number; per_page?: number; page?: number } = {}) =>
    (await api.get<Paginated<ShopNotification>>('/notifications', { params })).data,
  unreadCount: async () =>
    (await api.get<{ data: { count: number } }>('/notifications/unread-count')).data.data.count,
  markRead: async (id: string) => api.post(`/notifications/${id}/read`),
  markAllRead: async () => api.post('/notifications/read-all'),
  remove: async (id: string) => api.delete(`/notifications/${id}`),
}
