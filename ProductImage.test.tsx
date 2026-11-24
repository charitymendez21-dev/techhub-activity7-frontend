import { fireEvent, render, screen } from '@testing-library/react'
import ProductImage from '../components/catalog/ProductImage'

test('falls back to the catalog placeholder when a product image fails to load', () => {
  render(<ProductImage src="https://images.example.test/missing-product.jpg" alt="65W GaN USB-C Charger" />)

  const image = screen.getByRole('img', { name: '65W GaN USB-C Charger' })
  expect(image).toHaveAttribute('src', 'https://images.example.test/missing-product.jpg')

  fireEvent.error(image)

  expect(image).toHaveAttribute('src', '/tech-product-placeholder.svg')
})
