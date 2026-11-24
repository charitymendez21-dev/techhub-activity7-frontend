import axios from 'axios'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api/client'
import type { ApiResource, AuthUser } from '../types'

export const authUserQueryKey = ['auth', 'user'] as const

export function useAuthUser() {
  return useQuery<AuthUser | null>({
    queryKey: authUserQueryKey,
    queryFn: async () => {
      try {
        return (await api.get<ApiResource<AuthUser | null>>('/session')).data.data
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return null
        }

        throw error
      }
    },
    retry: false,
    staleTime: 60_000,
  })
}
