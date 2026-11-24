import { api, getCsrfCookie } from './client'
import type { ApiResource, AuthUser } from '../types'

export type ProfileValues = {
  first_name: string
  last_name: string
  email: string
  phone: string
  current_password?: string
}

export const profileApi = {
  update: async (values: ProfileValues) => {
    await getCsrfCookie()
    return (await api.put<ApiResource<AuthUser>>('/profile', values)).data.data
  },
  uploadAvatar: async (file: File) => {
    if (!file || file.size === 0) {
      throw new Error('Please choose a non-empty image file.')
    }
    const body = new FormData()
    body.append('avatar', file, file.name)
    await getCsrfCookie()
    return (await api.post<ApiResource<AuthUser>>('/profile/avatar', body)).data.data
  },
  deleteAvatar: async () => {
    await getCsrfCookie()
    return (await api.delete<ApiResource<AuthUser>>('/profile/avatar')).data.data
  },
  changePassword: async (values: {
    current_password: string
    password: string
    password_confirmation: string
  }) => {
    await getCsrfCookie()
    return api.put('/profile/password', values)
  },
}
