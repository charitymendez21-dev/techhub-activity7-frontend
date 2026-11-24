import { priceFormatter } from '../config/store'

export function formatCurrency(value: number | string | null | undefined): string {
  const amount = Number(value ?? 0)
  return priceFormatter.format(Number.isFinite(amount) ? amount : 0)
}
