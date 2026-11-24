import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Link,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { ordersApi } from '../api/orders'
import { getErrorMessage } from '../api/client'
import { priceFormatter } from '../config/store'
import OrderHistoryTimeline from '../components/orders/OrderHistoryTimeline'
import OrderStatusStepper from '../components/orders/OrderStatusStepper'
import StatusChip from '../components/orders/StatusChip'
import ProductImage from '../components/catalog/ProductImage'

function OrderDetailPage() {
  const { orderId = '' } = useParams()
  const queryClient = useQueryClient()
  const [cancelOpen, setCancelOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [feedback, setFeedback] = useState('')
  const orderQuery = useQuery({
    queryKey: ['orders', 'detail', orderId],
    queryFn: () => ordersApi.detail(orderId),
    enabled: Boolean(orderId),
    retry: false,
  })
  const cancelMutation = useMutation({
    mutationFn: () => ordersApi.cancel(Number(orderId), reason || undefined),
    onSuccess: (order) => {
      queryClient.setQueryData(['orders', 'detail', orderId], order)
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      setCancelOpen(false)
      setFeedback('Order cancelled. Stock has been restored.')
    },
    onError: (error) => {
      setFeedback(getErrorMessage(error))
      queryClient.invalidateQueries({ queryKey: ['orders', 'detail', orderId] })
      queryClient.invalidateQueries({ queryKey: ['orders'] })
    },
  })

  if (orderQuery.isPending) return <Box sx={{ minHeight: 300, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
  if (orderQuery.isError) {
    return (
      <Alert severity="error" action={<Button component={RouterLink} to="/orders" color="inherit">My orders</Button>}>
        {getErrorMessage(orderQuery.error)}
      </Alert>
    )
  }

  const order = orderQuery.data
  const money = (value: string) => priceFormatter.format(Number(value))

  return (
    <Stack spacing={2.5}>
      <Breadcrumbs>
        <Link component={RouterLink} to="/orders" underline="hover" color="inherit">My orders</Link>
        <Typography color="text.primary">{order.order_number}</Typography>
      </Breadcrumbs>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700}>{order.order_number}</Typography>
          <Typography color="text.secondary">Placed {new Date(order.created_at).toLocaleString()}</Typography>
        </Box>
        <StatusChip status={order.status} />
      </Stack>
      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <OrderStatusStepper status={order.status} />
      </Paper>
      {order.can_cancel && (
        <Button color="error" variant="outlined" sx={{ alignSelf: 'flex-start' }} onClick={() => setCancelOpen(true)}>
          Cancel order
        </Button>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 340px' }, gap: 2.5, alignItems: 'start' }}>
        <Stack spacing={2.5}>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Items</Typography>
            <Stack spacing={1.5}>
              {order.items.map((item) => (
                <Stack key={item.id} direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 56, height: 56, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                    <ProductImage src={item.image} alt={item.product_name} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    {item.product_slug ? (
                      <Link component={RouterLink} to={`/products/${item.product_slug}`} underline="hover" color="inherit" fontWeight={600}>
                        {item.product_name}
                      </Link>
                    ) : <Typography fontWeight={600}>{item.product_name}</Typography>}
                    <Typography variant="body2" color="text.secondary">{item.quantity} × {money(item.unit_price)}</Typography>
                  </Box>
                  <Typography fontWeight={600}>{money(item.line_total ?? '0')}</Typography>
                </Stack>
              ))}
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Status history</Typography>
            <OrderHistoryTimeline entries={order.status_history} />
          </Paper>
        </Stack>
        <Stack spacing={2.5}>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Order total</Typography>
            <Stack spacing={1}>
              <MoneyLine label="Subtotal" value={money(order.subtotal)} />
              <MoneyLine label="Shipping" value={money(order.shipping_fee)} />
              <MoneyLine label="Tax" value={money(order.tax)} />
              <MoneyLine label="Total" value={money(order.grand_total)} strong />
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Shipping and payment</Typography>
            <Typography fontWeight={600}>{order.shipping_name}</Typography>
            <Typography sx={{ whiteSpace: 'pre-line' }}>{order.shipping_address}</Typography>
            <Typography>{order.contact_number}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
              <Typography>{order.payment_method.toUpperCase()}</Typography>
              <StatusChip status={order.payment_status} />
            </Stack>
          </Paper>
        </Stack>
      </Box>
      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Cancel this order?</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>This pending order will be cancelled and its stock returned to inventory.</Typography>
          <TextField
            label="Reason (optional)"
            fullWidth
            multiline
            minRows={2}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)}>Keep order</Button>
          <Button color="error" onClick={() => cancelMutation.mutate()} disabled={cancelMutation.isPending}>
            {cancelMutation.isPending ? 'Cancelling…' : 'Cancel order'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(feedback)} autoHideDuration={4500} onClose={() => setFeedback('')} message={feedback} />
    </Stack>
  )
}

function MoneyLine({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ borderTop: strong ? 1 : 0, borderColor: 'divider', pt: strong ? 1 : 0 }}>
      <Typography fontWeight={strong ? 700 : 400}>{label}</Typography>
      <Typography fontWeight={strong ? 700 : 400}>{value}</Typography>
    </Stack>
  )
}

export default OrderDetailPage
