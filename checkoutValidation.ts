import type { CheckoutDetails } from '../api/checkout'

export type CheckoutFieldErrors = Partial<Record<keyof CheckoutDetails, string>>

export function validateCheckoutDetails(details: CheckoutDetails, fallbackName = ''): CheckoutFieldErrors {
  const errors: CheckoutFieldErrors = {}
  if (!(details.shipping_name || fallbackName).trim()) errors.shipping_name = 'Full name is required.'
  if (!details.shipping_address.trim()) errors.shipping_address = 'Shipping address is required.'
  if (!details.contact_number.trim()) errors.contact_number = 'Contact number is required.'
  return errors
}
