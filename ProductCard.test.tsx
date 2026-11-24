import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import ProductCard from '../components/catalog/ProductCard'
import type { ProductSummary } from '../api/products'

vi.mock('../api/client', () => ({
  api: { get: vi.fn().mockResolvedValue({ data: { data: { role: 'customer' } } }) },
  getErrorMessage: (error: unknown) => String(error),
}))

test('displays sale and regular prices', () => {
  const product: ProductSummary = {
    id: 1,
    name: 'Test Laptop',
    slug: 'test-laptop',
    brand: null,
    category: { id: 1, name: 'Laptops', slug: 'laptops' },
    image_url: null,
    price: '100.00',
    sale_price: '75.00',
    rating: 4,
    reviews_count: 2,
    in_stock: true,
  }
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>
    </QueryClientProvider>,
  )
  expect(screen.getByText('₱75.00')).toBeInTheDocument()
  expect(screen.getByText('₱100.00')).toBeInTheDocument()
  expect(screen.getByText('Sale')).toBeInTheDocument()
})
