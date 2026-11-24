import { useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Pagination,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { ordersApi, type OrderStatus } from '../api/orders'
import { getErrorMessage } from '../api/client'
import { priceFormatter } from '../config/store'
import StatusChip from '../components/orders/StatusChip'

const statuses: Array<OrderStatus | ''> = ['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']

function OrdersPage() {
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [page, setPage] = useState(1)
  const ordersQuery = useQuery({
    queryKey: ['orders', { status, page }],
    queryFn: () => ordersApi.list({ status, page, per_page: 10 }),
    placeholderData: keepPreviousData,
  })

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" component="h1" fontWeight={700}>My Orders</Typography>
        <Typography color="text.secondary">View your purchases and track their status.</Typography>
      </Box>
      <ToggleButtonGroup
        exclusive
        size="small"
        value={status}
        onChange={(_, value: OrderStatus | null) => {
          if (value !== null) {
            setStatus(value)
            setPage(1)
          }
        }}
        sx={{ alignSelf: 'flex-start', maxWidth: '100%', overflowX: 'auto' }}
      >
        {statuses.map((value) => (
          <ToggleButton key={value || 'all'} value={value} sx={{ textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
            {value || 'All'}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      {ordersQuery.isError && <Alert severity="error">{getErrorMessage(ordersQuery.error)}</Alert>}
      {ordersQuery.isPending ? (
        <Box sx={{ minHeight: 240, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
      ) : ordersQuery.data?.data.length ? (
        <Stack spacing={1.5}>
          {ordersQuery.data.data.map((order) => (
            <Paper key={order.id} component={RouterLink} to={`/orders/${order.id}`} variant="outlined"
              sx={{ p: 2, color: 'inherit', textDecoration: 'none', '&:hover': { borderColor: 'primary.main' } }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <Avatar variant="rounded" src={order.preview_image ?? undefined} alt="" sx={{ width: 58, height: 58 }} />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography fontWeight={700}>{order.order_number}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {new Date(order.created_at).toLocaleDateString()} · {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                  </Typography>
                </Box>
                <StatusChip status={order.status} />
                <Typography fontWeight={700}>{priceFormatter.format(Number(order.grand_total))}</Typography>
                <Button component="span" size="small">Details</Button>
              </Stack>
            </Paper>
          ))}
          <Pagination
            page={ordersQuery.data.meta.current_page}
            count={ordersQuery.data.meta.last_page}
            onChange={(_, nextPage) => setPage(nextPage)}
            sx={{ alignSelf: 'center' }}
          />
        </Stack>
      ) : (
        <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="h6">No orders found</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>Your purchases will appear here.</Typography>
          <Button component={RouterLink} to="/products" variant="contained" sx={{ mt: 2 }}>Browse products</Button>
        </Paper>
      )}
    </Stack>
  )
}

export default OrdersPage
