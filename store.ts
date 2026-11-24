import { SHOP_CURRENCY } from './shop'

export const priceFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: SHOP_CURRENCY,
})
