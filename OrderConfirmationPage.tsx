import { useQuery } from '@tanstack/react-query'
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import ProductImage from '../components/catalog/ProductImage'
import { checkoutApi } from '../api/checkout'
import { getErrorMessage } from '../api/client'
import { formatCurrency } from '../utils/formatCurrency'

function money(value: string): string {
  return formatCurrency(value)
}

function OrderConfirmationPage() {
  const { orderId = '' } = useParams()
  const orderQuery = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => checkoutApi.order(orderId),
    enabled: Boolean(orderId),
    retry: false,
  })

  if (orderQuery.isPending) {
    return <Box sx={{ minHeight: 300, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
  }
  if (orderQuery.isError) return <Alert severity="error">{getErrorMessage(orderQuery.error)}</Alert>
  const order = orderQuery.data

  return (
    <Paper sx={{ maxWidth: 760, mx: 'auto', p: { xs: 2.5, md: 4 } }}>
      <Stack spacing={2.5}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={800}>Thank you for your order!</Typography>
          <Typography color="text.secondary">Order number: <strong>{order.order_number}</strong></Typography>
        </Box>
        <Stack spacing={1.5}>
          {order.items.map((item) => (
            <Stack key={item.id} direction="row" spacing={1.5} alignItems="center">
              <Box sx={{ width: 56, height: 56, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                <ProductImage src={item.image} alt={item.product_name} />
              </Box>
              <Box sx={{ flexGrow: 1 }}>
                <Typography fontWeight={600}>{item.product_name}</Typography>
                <Typography variant="body2" color="text.secondary">{item.quantity} × {money(item.unit_price)}</Typography>
              </Box>
              <Typography>{money(item.line_total)}</Typography>
            </Stack>
          ))}
        </Stack>
        <Stack spacing={0.75} sx={{ borderTop: 1, borderColor: 'divider', pt: 2 }}>
          <Typography>Subtotal: {money(order.subtotal)}</Typography>
          <Typography>Shipping: {money(order.shipping_fee)}</Typography>
          <Typography>Tax: {money(order.tax)}</Typography>
          <Typography variant="h6" fontWeight={700}>Total: {money(order.grand_total)}</Typography>
        </Stack>
        <Box>
          <Typography fontWeight={700}>Shipping to</Typography>
          <Typography>{order.shipping_name}</Typography>
          <Typography>{order.shipping_address}</Typography>
          <Typography>{order.contact_number}</Typography>
          <Typography variant="body2" color="text.secondary">Cash on Delivery</Typography>
        </Box>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <Button component={RouterLink} to={`/orders/${order.id}`} variant="outlined">View order</Button>
          <Button component={RouterLink} to="/products" variant="contained">Continue shopping</Button>
        </Stack>
      </Stack>
    </Paper>
  )
}

export default OrderConfirmationPage
