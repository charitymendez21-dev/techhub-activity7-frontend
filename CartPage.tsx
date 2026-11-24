import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { DeleteOutline, RemoveShoppingCart } from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'
import { cartApi, type Cart } from '../api/cart'
import { getErrorMessage } from '../api/client'
import { cartQueryKey, useCart } from '../hooks/useCart'
import ProductImage from '../components/catalog/ProductImage'
import { formatCurrency } from '../utils/formatCurrency'

function money(value: string | number): string {
  return formatCurrency(value)
}

function CartPage() {
  const queryClient = useQueryClient()
  const cartQuery = useCart()
  const [confirmClear, setConfirmClear] = useState(false)
  const [feedback, setFeedback] = useState('')

  const removeMutation = useMutation({
    mutationFn: cartApi.remove,
    onSuccess: (cart) => queryClient.setQueryData(cartQueryKey, cart),
    onError: (error) => setFeedback(getErrorMessage(error)),
  })
  const clearMutation = useMutation({
    mutationFn: cartApi.clear,
    onSuccess: (cart) => {
      queryClient.setQueryData(cartQueryKey, cart)
      setConfirmClear(false)
      setFeedback('Cart cleared.')
    },
    onError: (error) => setFeedback(getErrorMessage(error)),
  })

  if (cartQuery.isPending) {
    return <Box sx={{ minHeight: 300, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
  }
  if (cartQuery.isError) return <Alert severity="error">{getErrorMessage(cartQuery.error)}</Alert>
  const cart = cartQuery.data
  if (!cart?.items.length) {
    return (
      <Paper sx={{ p: { xs: 3, md: 6 }, textAlign: 'center' }}>
        <RemoveShoppingCart color="action" sx={{ fontSize: 48 }} />
        <Typography variant="h4" component="h1" sx={{ mt: 1 }}>Your cart is empty</Typography>
        <Button component={RouterLink} to="/products" variant="contained" sx={{ mt: 2 }}>Browse products</Button>
      </Paper>
    )
  }

  return (
    <Stack spacing={3}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h4" component="h1" fontWeight={700}>Shopping cart</Typography>
        <Button color="error" onClick={() => setConfirmClear(true)} disabled={clearMutation.isPending}>
          Clear cart
        </Button>
      </Stack>
      {cart.items.some((item) => !item.is_available) && (
        <Alert severity="warning">Some items are unavailable or have less stock than requested. Update or remove them before checkout.</Alert>
      )}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 320px' }, gap: 3, alignItems: 'start' }}>
        <Stack spacing={1.5}>
          {cart.items.map((item) => (
            <CartItemRow
              key={item.id}
              item={item}
              onRemove={() => removeMutation.mutate(item.id)}
              removing={removeMutation.isPending && removeMutation.variables === item.id}
            />
          ))}
        </Stack>
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={700}>Order summary</Typography>
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
            <Typography>Subtotal ({cart.item_count} items)</Typography>
            <Typography fontWeight={700}>{money(cart.subtotal)}</Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary">Shipping and tax are calculated at checkout.</Typography>
          <Button
            component={RouterLink}
            to="/checkout"
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={cart.items.some((item) => !item.is_available)}
          >
            Proceed to checkout
          </Button>
        </Paper>
      </Box>
      <Dialog open={confirmClear} onClose={() => setConfirmClear(false)}>
        <DialogTitle>Clear your cart?</DialogTitle>
        <DialogContent><Typography>All items will be removed from your cart.</Typography></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmClear(false)}>Cancel</Button>
          <Button color="error" onClick={() => clearMutation.mutate()} disabled={clearMutation.isPending}>
            {clearMutation.isPending ? 'Clearing…' : 'Clear cart'}
          </Button>
        </DialogActions>
      </Dialog>
      {feedback && <Alert severity={clearMutation.isError || removeMutation.isError ? 'error' : 'success'} onClose={() => setFeedback('')}>{feedback}</Alert>}
    </Stack>
  )
}

type CartRowProps = {
  item: Cart['items'][number]
  onRemove: () => void
  removing: boolean
}

export function CartItemRow({ item, onRemove, removing }: CartRowProps) {
  const queryClient = useQueryClient()
  const [quantityDraft, setQuantityDraft] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const quantity = quantityDraft ?? item.quantity
  const { mutate: updateItem, isPending: isUpdating } = useMutation({
    mutationFn: ({ id, nextQuantity }: { id: number; nextQuantity: number }) => cartApi.update(id, nextQuantity),
    onMutate: async ({ nextQuantity }) => {
      await queryClient.cancelQueries({ queryKey: cartQueryKey })
      const previous = queryClient.getQueryData<Cart>(cartQueryKey)
      if (previous) {
        queryClient.setQueryData<Cart>(cartQueryKey, {
          ...previous,
          item_count: previous.item_count + nextQuantity - item.quantity,
          subtotal: String(Number(previous.subtotal) + (nextQuantity - item.quantity) * Number(item.unit_price)),
          items: previous.items.map((entry) => entry.id === item.id
            ? { ...entry, quantity: nextQuantity, line_total: String(nextQuantity * Number(entry.unit_price)) }
            : entry),
        })
      }
      return { previous }
    },
    onSuccess: (cart) => {
      setErrorMessage('')
      setQuantityDraft(null)
      queryClient.setQueryData(cartQueryKey, cart)
    },
    onError: (error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(cartQueryKey, context.previous)
      setQuantityDraft(null)
      setErrorMessage(getErrorMessage(error))
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: cartQueryKey }),
  })

  useEffect(() => {
    if (quantityDraft === null || quantityDraft === item.quantity || item.stock_available === 0) return
    const timer = window.setTimeout(() => {
      updateItem({ id: item.id, nextQuantity: quantityDraft })
    }, 350)

    return () => window.clearTimeout(timer)
  }, [item.id, item.quantity, item.stock_available, quantityDraft, updateItem])

  return (
    <Paper variant="outlined" sx={{ p: 2, display: 'grid', gridTemplateColumns: '72px minmax(0, 1fr) auto', gap: 2, alignItems: 'center' }}>
      <Box sx={{ width: 72, height: 72, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
        <ProductImage src={item.image} alt={item.name} />
      </Box>
      <Box minWidth={0}>
        <Typography component={RouterLink} to={item.slug ? `/products/${item.slug}` : '/products'} color="inherit" fontWeight={600} sx={{ textDecoration: 'none' }}>
          {item.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">{money(item.unit_price)} each</Typography>
        {!item.is_available && (
          <Typography variant="caption" color="error.main">
            {item.stock_available === 0 ? 'Currently unavailable' : `Only ${item.stock_available} available`}
          </Typography>
        )}
        {item.is_available && item.stock_available <= item.low_stock_threshold && (
          <Typography variant="caption" color="warning.main">Low stock: {item.stock_available} available</Typography>
        )}
        {errorMessage && <Typography variant="caption" color="error" display="block">{errorMessage}</Typography>}
      </Box>
      <Stack alignItems="flex-end" spacing={0.5}>
        <Typography fontWeight={700}>{money(item.line_total)}</Typography>
        <Stack direction="row" spacing={0.5} alignItems="center">
          <TextField
            label="Quantity"
            type="number"
            size="small"
            value={quantity}
            onChange={(event) => {
              const next = Number(event.target.value)
              setQuantityDraft(Math.max(1, Math.min(Math.floor(Number.isFinite(next) ? next : 1), Math.max(item.stock_available, 1))))
            }}
            inputProps={{ min: 1, max: Math.max(item.stock_available, 1), step: 1 }}
            disabled={item.stock_available === 0 || isUpdating}
            sx={{ width: 88 }}
          />
          <IconButton aria-label={`Remove ${item.name}`} color="error" onClick={onRemove} disabled={removing}>
            {removing ? <CircularProgress size={20} /> : <DeleteOutline />}
          </IconButton>
        </Stack>
      </Stack>
    </Paper>
  )
}

export default CartPage
