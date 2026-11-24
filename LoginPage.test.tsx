import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import { api, getCsrfCookie } from '../api/client'
import LoginPage from '../pages/LoginPage'

vi.mock('../api/client', () => ({
  api: { post: vi.fn() },
  getCsrfCookie: vi.fn(),
  getErrorMessage: (error: unknown) => String(error),
}))

const adminUser = {
  id: 1,
  name: 'TECHHUB Administrator',
  first_name: 'TECHHUB',
  last_name: 'Administrator',
  email: 'admin@techhub.com',
  role: 'admin' as const,
  phone: null,
  avatar_url: null,
}

test('sends an admin away from an inaccessible customer return URL after login', async () => {
  vi.mocked(getCsrfCookie).mockResolvedValue(undefined)
  vi.mocked(api.post).mockResolvedValue({ data: { data: adminUser } } as never)

  const queryClient = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login?returnUrl=%2Forders']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/products" element={<div>Store products</div>} />
          <Route path="/orders" element={<div>Customer orders</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  )

  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@techhub.com' } })
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'configured-password' } })
  fireEvent.click(screen.getByRole('button', { name: 'Sign in' }))

  expect(await screen.findByText('Store products')).toBeInTheDocument()
  expect(api.post).toHaveBeenCalledWith('/login', {
    email: 'admin@techhub.com',
    password: 'configured-password',
    remember: false,
  })

  queryClient.clear()
})
