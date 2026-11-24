import type { PropsWithChildren } from 'react'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { vi } from 'vitest'
import { api } from '../api/client'
import { useAuthUser } from '../hooks/useAuthUser'

vi.mock('../api/client', () => ({
  api: { get: vi.fn() },
}))

test('treats a shared 401 user query as a cached guest result', async () => {
  vi.mocked(api.get).mockRejectedValue(Object.assign(new Error('Unauthorized'), {
    isAxiosError: true,
    response: { status: 401 },
  }))

  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const wrapper = ({ children }: PropsWithChildren) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
  const firstUser = renderHook(() => useAuthUser(), { wrapper })
  const secondUser = renderHook(() => useAuthUser(), { wrapper })

  await waitFor(() => expect(firstUser.result.current.isSuccess).toBe(true))

  expect(firstUser.result.current.data).toBeNull()
  expect(secondUser.result.current.data).toBeNull()
  expect(firstUser.result.current.isError).toBe(false)
  expect(api.get).toHaveBeenCalledTimes(1)

  queryClient.clear()
})
