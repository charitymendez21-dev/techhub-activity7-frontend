import { fireEvent, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { CartItemRow } from '../pages/CartPage'

test('quantity field clamps to stock limits', () => {
  const item = {
    id: 1,
    product_id: 1,
    name: 'Limited item',
    slug: 'limited-item',
    image: null,
    quantity: 2,
    unit_price: '10.00',
    line_total: '20.00',
    stock_available: 3,
    low_stock_threshold: 1,
    is_available: true,
  }
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <CartItemRow item={item} onRemove={() => undefined} removing={false} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  const input = screen.getByLabelText('Quantity') as HTMLInputElement
  fireEvent.change(input, { target: { value: '99' } })
  expect(input.value).toBe('3')
  fireEvent.change(input, { target: { value: '0' } })
  expect(input.value).toBe('1')
})
