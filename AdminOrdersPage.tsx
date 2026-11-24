import { useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  Tab,
  TextField,
  Typography,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { adminApi, getAdminError } from '../../api/admin'
import type { OrderStatus } from '../../api/orders'
import StatusChip from '../../components/orders/StatusChip'
import { priceFormatter } from '../../config/store'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'

const statuses: Array<OrderStatus | ''> = ['', 'pending', 'processing', 'shipped', 'delivered', 'cancelled']

function AdminOrdersPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [paymentStatus, setPaymentStatus] = useState('')
  const [sort, setSort] = useState<'newest' | 'oldest' | 'total_desc' | 'total_asc'>('newest')
  const [page, setPage] = useState(0)
  const params = useMemo(() => ({
    search: debouncedSearch || undefined,
    status: status || undefined,
    date_from: dateFrom || undefined,
    date_to: dateTo || undefined,
    payment_status: paymentStatus || undefined,
    sort,
    page: page + 1,
    per_page: 10,
  }), [dateFrom, dateTo, debouncedSearch, page, paymentStatus, sort, status])
  const ordersQuery = useQuery({
    queryKey: ['admin', 'orders', params],
    queryFn: () => adminApi.orders(params),
    placeholderData: keepPreviousData,
  })
  const countsQuery = useQuery({
    queryKey: ['admin', 'order-status-counts'],
    queryFn: adminApi.orderStatusCounts,
  })
  const rows = ordersQuery.data?.data ?? []

  function resetPage(action: () => void) {
    action()
    setPage(0)
  }

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" component="h1" fontWeight={700}>Orders</Typography>
        <Typography color="text.secondary">Review purchases and manage their lifecycle.</Typography>
      </Box>
      {countsQuery.isError && <Alert severity="warning">Order status counts could not be loaded.</Alert>}
      <Paper sx={{ overflow: 'hidden' }}>
        <Tabs
          value={status}
          onChange={(_, value: OrderStatus | '') => resetPage(() => setStatus(value))}
          variant="scrollable"
          scrollButtons="auto"
        >
          {statuses.map((value) => (
            <Tab
              key={value || 'all'}
              value={value}
              label={`${value ? value[0].toUpperCase() + value.slice(1) : 'All'} (${value ? countsQuery.data?.[value] ?? 0 : Object.values(countsQuery.data ?? {}).reduce((sum, count) => sum + count, 0)})`}
              sx={{ textTransform: 'capitalize' }}
            />
          ))}
        </Tabs>
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={1.5} sx={{ p: 2 }}>
          <TextField
            label="Search order or customer"
            size="small"
            value={search}
            onChange={(event) => resetPage(() => setSearch(event.target.value))}
            sx={{ flexGrow: 1, minWidth: 200 }}
          />
          <TextField
            label="From"
            type="date"
            size="small"
            value={dateFrom}
            onChange={(event) => resetPage(() => setDateFrom(event.target.value))}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="To"
            type="date"
            size="small"
            value={dateTo}
            onChange={(event) => resetPage(() => setDateTo(event.target.value))}
            InputLabelProps={{ shrink: true }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="order-payment-filter">Payment</InputLabel>
            <Select
              labelId="order-payment-filter"
              label="Payment"
              value={paymentStatus}
              onChange={(event) => resetPage(() => setPaymentStatus(event.target.value))}
            >
              <MenuItem value="">All payments</MenuItem>
              <MenuItem value="unpaid">Unpaid</MenuItem>
              <MenuItem value="paid">Paid</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel id="order-sort">Sort</InputLabel>
            <Select
              labelId="order-sort"
              label="Sort"
              value={sort}
              onChange={(event) => resetPage(() => setSort(event.target.value as typeof sort))}
            >
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="oldest">Oldest</MenuItem>
              <MenuItem value="total_desc">Total: high to low</MenuItem>
              <MenuItem value="total_asc">Total: low to high</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </Paper>
      {ordersQuery.isError && <Alert severity="error">{getAdminError(ordersQuery.error)}</Alert>}
      <Paper>
        <TableContainer>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>Order</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Items</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Payment</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {ordersQuery.isPending ? (
                <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={28} sx={{ my: 2 }} /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center">No orders found.</TableCell></TableRow>
              ) : rows.map((order) => (
                <TableRow
                  key={order.id}
                  hover
                  tabIndex={0}
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/orders/${order.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') navigate(`/admin/orders/${order.id}`)
                  }}
                >
                  <TableCell><Typography fontWeight={600}>{order.order_number}</Typography></TableCell>
                  <TableCell>
                    <Typography>{order.customer?.name ?? 'Unknown customer'}</Typography>
                    <Typography variant="caption" color="text.secondary">{order.customer?.email}</Typography>
                  </TableCell>
                  <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>{order.item_count}</TableCell>
                  <TableCell>{priceFormatter.format(Number(order.grand_total))}</TableCell>
                  <TableCell><StatusChip status={order.payment_status} /></TableCell>
                  <TableCell><StatusChip status={order.status} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={ordersQuery.data?.meta.total ?? 0}
          page={page}
          rowsPerPage={10}
          rowsPerPageOptions={[10]}
          onPageChange={(_, nextPage) => setPage(nextPage)}
        />
      </Paper>
    </Stack>
  )
}

export default AdminOrdersPage
