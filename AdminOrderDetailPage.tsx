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
  FormControl,
  InputLabel,
  Link,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useParams } from 'react-router-dom'
import { adminApi, getAdminError } from '../../api/admin'
import type { OrderStatus } from '../../api/orders'
import { priceFormatter } from '../../config/store'
import OrderHistoryTimeline from '../../components/orders/OrderHistoryTimeline'
import OrderStatusStepper from '../../components/orders/OrderStatusStepper'
import StatusChip from '../../components/orders/StatusChip'
import ProductImage from '../../components/catalog/ProductImage'

function AdminOrderDetailPage() {
  const { orderId = '' } = useParams()
  const queryClient = useQueryClient()
  const [nextStatus, setNextStatus] = useState<OrderStatus | ''>('')
  const [note, setNote] = useState('')
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [feedback, setFeedback] = useState('')
  const orderQuery = useQuery({
    queryKey: ['admin', 'orders', 'detail', orderId],
    queryFn: () => adminApi.order(orderId),
    enabled: Boolean(orderId),
    retry: false,
  })
  const statusMutation = useMutation({
    mutationFn: () => {
      if (!nextStatus) throw new Error('Choose a status before submitting.')
      return adminApi.updateOrderStatus(Number(orderId), nextStatus, note || undefined)
    },
    onSuccess: (order) => {
      queryClient.setQueryData(['admin', 'orders', 'detail', orderId], order)
      invalidateOrderQueries()
      setConfirmOpen(false)
      setNextStatus('')
      setNote('')
      setFeedback(`Order status changed to ${order.status}.`)
    },
    onError: (error) => {
      setFeedback(getAdminError(error))
      invalidateOrderQueries()
    },
  })

  function invalidateOrderQueries() {
    queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'order-status-counts'] })
    queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
    queryClient.invalidateQueries({ queryKey: ['catalog'] })
  }

  if (orderQuery.isPending) return <Box sx={{ minHeight: 300, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
  if (orderQuery.isError) {
    return (
      <Alert severity="error" action={<Button component={RouterLink} to="/admin/orders" color="inherit">Orders</Button>}>
        {getAdminError(orderQuery.error)}
      </Alert>
    )
  }

  const order = orderQuery.data
  const money = (value: string) => priceFormatter.format(Number(value))

  return (
    <Stack spacing={2.5}>
      <Breadcrumbs>
        <Link component={RouterLink} to="/admin/orders" underline="hover" color="inherit">Orders</Link>
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
      {order.allowed_next_statuses.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel id="next-order-status">Next status</InputLabel>
              <Select
                labelId="next-order-status"
                label="Next status"
                value={nextStatus}
                onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
              >
                {order.allowed_next_statuses.map((status) => (
                  <MenuItem key={status} value={status} sx={{ textTransform: 'capitalize' }}>{status}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button variant="contained" disabled={!nextStatus} onClick={() => setConfirmOpen(true)}>
              Update status
            </Button>
          </Stack>
        </Paper>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 340px' }, gap: 2.5, alignItems: 'start' }}>
        <Stack spacing={2.5}>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Customer and shipping</Typography>
            <Typography fontWeight={600}>{order.customer?.name ?? order.shipping_name}</Typography>
            {order.customer?.email && <Typography>{order.customer.email}</Typography>}
            <Typography sx={{ mt: 1, whiteSpace: 'pre-line' }}>{order.shipping_address}</Typography>
            <Typography>{order.contact_number}</Typography>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
              <Typography>{order.payment_method.toUpperCase()}</Typography>
              <StatusChip status={order.payment_status} />
            </Stack>
          </Paper>
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography variant="h6" fontWeight={700} gutterBottom>Items</Typography>
            <Stack spacing={1.5}>
              {order.items.map((item) => (
                <Stack key={item.id} direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 56, height: 56, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                    <ProductImage src={item.image} alt={item.product_name} />
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography fontWeight={600}>{item.product_name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.sku ? `SKU ${item.sku} · ` : ''}{item.quantity} × {money(item.unit_price)}
                    </Typography>
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
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>Order total</Typography>
          <Stack spacing={1}>
            <MoneyLine label="Subtotal" value={money(order.subtotal)} />
            <MoneyLine label="Shipping" value={money(order.shipping_fee)} />
            <MoneyLine label="Tax" value={money(order.tax)} />
            <MoneyLine label="Total" value={money(order.grand_total)} strong />
          </Stack>
        </Paper>
      </Box>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Confirm order status</DialogTitle>
        <DialogContent>
          {nextStatus === 'cancelled' && (
            <Alert severity="warning" sx={{ mb: 2 }}>Stock will be restored</Alert>
          )}
          <Typography sx={{ mb: 2 }}>
            Change {order.order_number} to <strong>{nextStatus}</strong>?
          </Typography>
          <TextField
            label="Note (optional)"
            fullWidth
            multiline
            minRows={2}
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Back</Button>
          <Button onClick={() => statusMutation.mutate()} disabled={statusMutation.isPending || !nextStatus}>
            {statusMutation.isPending ? 'Updating…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={Boolean(feedback)} autoHideDuration={5000} onClose={() => setFeedback('')} message={feedback} />
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

export default AdminOrderDetailPage
