import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { vi } from 'vitest'
import CustomerRoute from '../components/CustomerRoute'

const authState = vi.hoisted(() => ({ data: null as { role: 'customer' | 'admin' } | null }))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ isPending: false, data: authState.data }),
}))

vi.mock('../api/client', () => ({
  api: { get: vi.fn() },
}))

test('redirects protected route when unauthenticated', () => {
  authState.data = null
  render(
    <MemoryRouter initialEntries={['/cart']}>
      <Routes>
        <Route element={<CustomerRoute />}>
          <Route path="/cart" element={<div>Cart</div>} />
        </Route>
        <Route path="/login" element={<div>Login page</div>} />
      </Routes>
    </MemoryRouter>,
  )
  expect(screen.getByText('Login page')).toBeInTheDocument()
})

test('redirects an admin away from customer-only routes to the store', () => {
  authState.data = { role: 'admin' }
  render(
    <MemoryRouter initialEntries={['/orders']}>
      <Routes>
        <Route element={<CustomerRoute />}>
          <Route path="/orders" element={<div>Orders</div>} />
        </Route>
        <Route path="/products" element={<div>Store products</div>} />
      </Routes>
    </MemoryRouter>,
  )

  expect(screen.getByText('Store products')).toBeInTheDocument()
})
