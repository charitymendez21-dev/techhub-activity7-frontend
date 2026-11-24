import { render, screen } from '@testing-library/react'
import { afterEach, vi } from 'vitest'
import ProductFilters, { type FilterValues } from '../components/catalog/ProductFilters'

const values: FilterValues = {
  category: 'displays-monitors',
  brands: [],
  minimum: 0,
  maximum: 100,
  rating: '',
  inStock: false,
}

afterEach(() => {
  vi.restoreAllMocks()
})

test('uses the all-categories option while selected category options are unavailable', () => {
  const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
  const error = vi.spyOn(console, 'error').mockImplementation(() => undefined)

  render(
    <ProductFilters
      categories={[]}
      categoriesLoaded={false}
      brands={[]}
      minBound={0}
      maxBound={100}
      values={values}
      onChange={() => undefined}
      onPriceChange={() => undefined}
      onClear={() => undefined}
    />,
  )

  expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('All categories')
  expect([...warning.mock.calls, ...error.mock.calls].flat().join(' ')).not.toContain('out-of-range')
})

test('marks a category unavailable instead of passing an invalid select value', () => {
  render(
    <ProductFilters
      categories={[]}
      categoriesLoaded
      brands={[]}
      minBound={0}
      maxBound={100}
      values={values}
      onChange={() => undefined}
      onPriceChange={() => undefined}
      onClear={() => undefined}
    />,
  )

  expect(screen.getByRole('combobox', { name: 'Category' })).toHaveTextContent('Unavailable category')
})
