import { validateCheckoutDetails } from '../utils/checkoutValidation'

test('returns checkout field validation messages', () => {
  const errors = validateCheckoutDetails({
    shipping_name: '',
    shipping_address: '',
    contact_number: '',
    payment_method: 'cod',
    notes: '',
  })
  expect(errors.shipping_name).toBe('Full name is required.')
  expect(errors.shipping_address).toBe('Shipping address is required.')
  expect(errors.contact_number).toBe('Contact number is required.')
})
