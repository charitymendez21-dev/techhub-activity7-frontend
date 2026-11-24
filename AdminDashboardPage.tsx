import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import {
  Inventory2Outlined,
  PeopleAltOutlined,
  Refresh,
  ReceiptLongOutlined,
  ShowChart,
  StorefrontOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link as RouterLink } from 'react-router-dom'
import { dashboardApi } from '../../api/dashboard'
import { formatCurrency } from '../../utils/formatCurrency'
import ProductImage from '../../components/catalog/ProductImage'

function AdminDashboardPage() {
  const [months, setMonths] = useState(6)
  const dashboardQuery = useQuery({
    queryKey: ['admin', 'dashboard', months],
    queryFn: () => dashboardApi.get(months),
    refetchInterval: 60_000,
  })
  const data = dashboardQuery.data
  const stats = data?.widgets
  const cards = stats ? [
    { label: 'Customers', value: stats.total_users, icon: <PeopleAltOutlined color="primary" /> },
    { label: 'Products', value: stats.total_products, icon: <Inventory2Outlined color="primary" /> },
    { label: 'Orders', value: stats.total_orders, icon: <ReceiptLongOutlined color="primary" /> },
    { label: 'Sales today', value: formatCurrency(stats.sales_today), icon: <ShowChart color="primary" /> },
    { label: 'Sales this month', value: formatCurrency(stats.sales_this_month), icon: <ShowChart color="primary" /> },
    { label: 'Low stock', value: stats.low_stock_count, icon: <WarningAmberOutlined color="warning" /> },
    { label: 'Pending orders', value: stats.pending_orders_count, icon: <ReceiptLongOutlined color="warning" /> },
  ] : []
  const chartEmpty = (rows: unknown[] | undefined) => !rows?.length

  return (
    <Stack spacing={3}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight={700} sx={{ flexGrow: 1 }}>Dashboard</Typography>
        <Button component={RouterLink} to="/" variant="outlined" startIcon={<StorefrontOutlined />}>
          Back to store
        </Button>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="dashboard-months-label">Range</InputLabel>
          <Select labelId="dashboard-months-label" label="Range" value={months} onChange={(event) => setMonths(Number(event.target.value))}>
            {[3, 6, 12].map((value) => <MenuItem key={value} value={value}>{value} months</MenuItem>)}
          </Select>
        </FormControl>
        <Button startIcon={<Refresh />} onClick={() => dashboardQuery.refetch()} disabled={dashboardQuery.isFetching}>Refresh</Button>
      </Stack>
      <Alert severity="info">{data?.revenue_note ?? 'Sales include pending orders and exclude cancelled orders.'}</Alert>
      {dashboardQuery.isError && <Alert severity="error">Unable to load dashboard metrics. Please refresh to try again.</Alert>}
      <Grid container spacing={2}>
        {dashboardQuery.isPending
          ? Array.from({ length: 7 }, (_, index) => (
            <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card><CardContent><Skeleton width="60%" /><Skeleton height={38} width="45%" /></CardContent></Card>
            </Grid>
          ))
          : cards.map((card) => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 3 }}>
              <Card><CardContent>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  {card.icon}
                  <Box>
                    <Typography color="text.secondary" variant="body2">{card.label}</Typography>
                    <Typography variant="h5" fontWeight={700}>{card.value}</Typography>
                  </Box>
                </Stack>
              </CardContent></Card>
            </Grid>
          ))}
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card><CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Monthly Sales</Typography>
            {chartEmpty(data?.monthly_sales)
              ? <Alert severity="info">No sales data is available for this range.</Alert>
              : <Box sx={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <AreaChart data={data?.monthly_sales}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis tickFormatter={(value: number) => formatCurrency(value)} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Area type="monotone" dataKey="total" stroke="#3657c8" fill="#9eafff" name="Sales" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>}
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card><CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Orders per Month</Typography>
            {chartEmpty(data?.orders_per_month)
              ? <Alert severity="info">No orders are available for this range.</Alert>
              : <Box sx={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={data?.orders_per_month}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3657c8" name="Orders" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>}
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card><CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Top Products</Typography>
            {chartEmpty(data?.top_products)
              ? <Alert severity="info">No products have sold in this range.</Alert>
              : <Box sx={{ width: '100%', height: 280 }}>
                <ResponsiveContainer>
                  <BarChart data={data?.top_products} layout="vertical" margin={{ left: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={120} />
                    <Tooltip />
                    <Bar dataKey="quantity" fill="#3657c8" name="Units sold" />
                  </BarChart>
                </ResponsiveContainer>
              </Box>}
          </CardContent></Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card><CardContent>
            <Typography variant="h6" fontWeight={700} gutterBottom>Low Stock</Typography>
            {!data?.low_stock_products.length
              ? <Alert severity="success">All active products are above their low-stock thresholds.</Alert>
              : <Stack divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />} spacing={1}>
                {data.low_stock_products.map((product) => (
                  <Stack key={product.id} direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 42, height: 42, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                      <ProductImage src={product.thumbnail} alt={product.name} />
                    </Box>
                    <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                      <Typography noWrap fontWeight={600}>{product.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{product.sku} · {product.stock} in stock (threshold {product.threshold})</Typography>
                    </Box>
                    <Button component={RouterLink} to={`/admin/products/${product.id}/edit`} size="small">Edit</Button>
                  </Stack>
                ))}
              </Stack>}
          </CardContent></Card>
        </Grid>
      </Grid>
    </Stack>
  )
}

export default AdminDashboardPage
