import { Chip } from '@mui/material'
import type { OrderStatus, PaymentStatus } from '../../api/orders'

const statusColor = {
  pending: 'warning',
  processing: 'info',
  shipped: 'primary',
  delivered: 'success',
  cancelled: 'default',
} as const

type Props = {
  status: OrderStatus | PaymentStatus
}

function StatusChip({ status }: Props) {
  const color = status === 'paid'
    ? 'success'
    : status === 'unpaid'
      ? 'default'
      : status === 'refunded'
        ? 'warning'
        : statusColor[status]

  return (
    <Chip
      size="small"
      color={color}
      label={status.replace(/_/g, ' ')}
      sx={{ textTransform: 'capitalize' }}
    />
  )
}

export default StatusChip
