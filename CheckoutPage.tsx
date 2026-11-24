import { useState, type FormEvent } from 'react'
import axios from 'axios'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormLabel,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink, Navigate, useNavigate } from 'react-router-dom'
import { checkoutApi, type CheckoutDetails, type CheckoutSummary } from '../api/checkout'
import { getErrorMessage } from '../api/client'
import { cartQueryKey, useCart } from '../hooks/useCart'
import { useAuthUser } from '../hooks/useAuthUser'
import { formatCurrency } from '../utils/formatCurrency'
import { validateCheckoutDetails, type CheckoutFieldErrors } from '../utils/checkoutValidation'

type FieldErrors = CheckoutFieldErrors
type StockProblem = { product_id: number; product_name: string; requested: number; available: number; reason: string }


function money(value: string): string {
  return formatCurrency(value)
}

function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const cartQuery = useCart()
  const [details, setDetails] = useState<CheckoutDetails>({
    shipping_name: '',
    shipping_address: '',
    contact_number: '',
    payment_method: 'cod',
    notes: '',
  })
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [stockProblems, setStockProblems] = useState<StockProblem[]>([])
  const userQuery = useAuthUser()
  const summaryQuery = useQuery<CheckoutSummary>({
    queryKey: ['checkout', 'summary'],
    queryFn: checkoutApi.summary,
    enabled: Boolean(cartQuery.data?.items.length),
    retry: false,
  })
  const orderMutation = useMutation({
    mutationFn: checkoutApi.place,
    onSuccess: (order) => {
      queryClient.setQueryData(cartQueryKey, { items: [], subtotal: '0.00', item_count: 0 })
      queryClient.invalidateQueries({ queryKey: ['checkout', 'summary'] })
      navigate(`/orders/${order.id}/confirmation`)
    },
    onError: (error) => {
      setFieldErrors({})
      setStockProblems([])
      if (axios.isAxiosError<{ errors?: Record<string, string[]>; problems?: StockProblem[] }>(error)) {
        const response = error.response?.data
        if (response?.errors) {
          setFieldErrors(Object.fromEntries(Object.entries(response.errors).map(([key, messages]) => [key, messages[0]])))
        }
        if (response?.problems) setStockProblems(response.problems)
      }
    },
  })

  if (cartQuery.isPending || userQuery.isPending) {
    return <Box sx={{ minHeight: 300, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
  }
  if (cartQuery.isError) return <Alert severity="error">{getErrorMessage(cartQuery.error)}</Alert>
  if (!cartQuery.data?.items.length) return <Navigate to="/cart" replace />

  const summary = summaryQuery.data
  const field = (name: keyof CheckoutDetails) => ({
    value: name === 'shipping_name'
      ? details.shipping_name || userQuery.data?.name || ''
      : details[name] ?? '',
    onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
      setDetails((current) => ({ ...current, [name]: event.target.value }))
      setFieldErrors((current) => ({ ...current, [name]: undefined }))
    },
    error: Boolean(fieldErrors[name]),
    helperText: fieldErrors[name],
  })

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setStockProblems([])
    const validationErrors = validateCheckoutDetails(details, userQuery.data?.name)
    if (Object.keys(validationErrors).length) {
      setFieldErrors(validationErrors)
      return
    }
    orderMutation.mutate({
      ...details,
      shipping_name: details.shipping_name || userQuery.data?.name || '',
    })
  }

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1" fontWeight={700}>Checkout</Typography>
      {stockProblems.length > 0 && (
        <Alert severity="error" action={<Button component={RouterLink} to="/cart" color="inherit">Review cart</Button>}>
          <Typography fontWeight={700}>Some items could not be checked out:</Typography>
          {stockProblems.map((problem) => (
            <Typography key={problem.product_id} variant="body2">
              {problem.product_name}: requested {problem.requested}, available {problem.available}. {problem.reason}
            </Typography>
          ))}
        </Alert>
      )}
      {orderMutation.isError && !stockProblems.length && !Object.keys(fieldErrors).length && (
        <Alert severity="error">{getErrorMessage(orderMutation.error)}</Alert>
      )}
      <Box component="form" onSubmit={submit} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 360px' }, gap: 3, alignItems: 'start' }}>
        <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
          <Stack spacing={2}>
            <Typography variant="h6" fontWeight={700}>Shipping details</Typography>
            <TextField label="Full name" required {...field('shipping_name')} />
            <TextField label="Shipping address" required multiline minRows={3} {...field('shipping_address')} />
            <TextField label="Contact number" required {...field('contact_number')} />
            <TextField label="Order notes (optional)" multiline minRows={2} {...field('notes')} />
            <FormControl>
              <FormLabel>Payment method</FormLabel>
              <RadioGroup value="cod">
                <FormControlLabel value="cod" control={<Radio checked />} label="Cash on Delivery" />
                <FormControlLabel value="gcash" disabled control={<Radio />} label="GCash (coming soon)" />
                <FormControlLabel value="paypal" disabled control={<Radio />} label="PayPal (coming soon)" />
              </RadioGroup>
            </FormControl>
          </Stack>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2.5 }}>
          <Typography variant="h6" fontWeight={700}>Order summary</Typography>
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            {cartQuery.data.items.map((item) => (
              <Stack key={item.id} direction="row" justifyContent="space-between" spacing={1}>
                <Typography variant="body2">{item.name} × {item.quantity}</Typography>
                <Typography variant="body2">{money(item.line_total)}</Typography>
              </Stack>
            ))}
            {summaryQuery.isError && <Alert severity="error">{getErrorMessage(summaryQuery.error)}</Alert>}
            <SummaryLine label="Subtotal" value={summary?.subtotal} />
            <SummaryLine label="Shipping" value={summary?.shipping_fee} />
            <SummaryLine label="Tax" value={summary?.tax} />
            <SummaryLine label="Total" value={summary?.grand_total} strong />
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={orderMutation.isPending || summaryQuery.isPending || !summary}
            >
              {orderMutation.isPending ? 'Placing order…' : 'Place order'}
            </Button>
          </Stack>
        </Paper>
      </Box>
    </Stack>
  )
}

function SummaryLine({ label, value, strong = false }: { label: string; value?: string; strong?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between" sx={{ borderTop: strong ? 1 : 0, borderColor: 'divider', pt: strong ? 1.5 : 0 }}>
      <Typography fontWeight={strong ? 700 : 400}>{label}</Typography>
      <Typography fontWeight={strong ? 700 : 400}>
        {value === undefined ? '—' : money(value)}
      </Typography>
    </Stack>
  )
}

export default CheckoutPage
