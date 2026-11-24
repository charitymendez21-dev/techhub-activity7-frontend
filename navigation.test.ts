import { getPostLoginUrl, getSafeReturnUrl } from '../utils/navigation'

test('uses products as the default after login', () => {
  expect(getPostLoginUrl(null, 'customer')).toBe('/products')
  expect(getPostLoginUrl(null, 'admin')).toBe('/products')
})

test('preserves return paths allowed for the signed-in role', () => {
  expect(getPostLoginUrl('/orders/12', 'customer')).toBe('/orders/12')
  expect(getPostLoginUrl('/admin/products/43/edit', 'admin')).toBe('/admin/products/43/edit')
  expect(getPostLoginUrl('/products?category=audio', 'admin')).toBe('/products?category=audio')
})

test('routes role-incompatible or login return paths to products', () => {
  expect(getPostLoginUrl('/orders', 'admin')).toBe('/products')
  expect(getPostLoginUrl('/admin/products', 'customer')).toBe('/products')
  expect(getPostLoginUrl('/login?returnUrl=%2Forders', 'customer')).toBe('/products')
})

test('rejects external return URLs', () => {
  expect(getSafeReturnUrl('//example.com')).toBe('/')
  expect(getPostLoginUrl('https://example.com', 'customer')).toBe('/')
})
