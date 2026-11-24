import { useMemo, useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material'
import { Download, TableView } from '@mui/icons-material'
import { useLocation, useSearchParams } from 'react-router-dom'
import { exportErrorMessage, reportsApi, type ReportFilters, type ReportType } from '../../api/reports'
import { adminApi } from '../../api/admin'
import { formatCurrency } from '../../utils/formatCurrency'

const reportTabs: Array<{ key: ReportType; label: string }> = [
  { key: 'sales', label: 'Sales' },
  { key: 'product', label: 'Products' },
  { key: 'inventory', label: 'Inventory' },
  { key: 'customer', label: 'Customers' },
]

const moneyKeys = new Set([
  'grand_total', 'total_subtotal', 'total_shipping', 'total_tax', 'average_order_value',
  'total_stock_value', 'total_revenue', 'average_spend', 'total_spent', 'revenue',
])

function AdminReportsPage() {
  const location = useLocation()

  return <AdminReportsContent key={location.search} />
}

function AdminReportsContent() {
  const [searchParams, setSearchParams] = useSearchParams()
  const type = (reportTabs.some((tab) => tab.key === searchParams.get('type'))
    ? searchParams.get('type')
    : 'sales') as ReportType
  const [filters, setFilters] = useState<Record<string, string>>(() =>
    Object.fromEntries([...searchParams.entries()].filter(([key]) => !['type', 'page'].includes(key))),
  )
  const [exporting, setExporting] = useState<'pdf' | 'xlsx' | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const page = Math.max(0, Number(searchParams.get('page') ?? 1) - 1)

  const params = useMemo((): ReportFilters => ({
    ...filters,
    page: page + 1,
    per_page: 10,
  }), [filters, page])
  const reportQuery = useQuery({
    queryKey: ['admin', 'reports', type, params],
    queryFn: () => reportsApi.get(type, params),
  })
  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories', 'report-filters'],
    queryFn: () => adminApi.categories({ per_page: 100 }),
    enabled: type === 'product' || type === 'inventory',
  })
  const brandsQuery = useQuery({
    queryKey: ['admin', 'brands', 'report-filters'],
    queryFn: () => adminApi.brands({ per_page: 100 }),
    enabled: type === 'product' || type === 'inventory',
  })

  const changeTab = (nextType: ReportType) => {
    setFilters({})
    setSearchParams(() => {
      const next = new URLSearchParams()
      next.set('type', nextType)
      return next
    })
  }
  const filtersUrlParams = () => {
    const next = new URLSearchParams()
    next.set('type', type)
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== '') next.set(key, value)
    })
    return next
  }
  const generate = (event: FormEvent) => {
    event.preventDefault()
    setSearchParams(filtersUrlParams())
  }
  const changePage = (_: unknown, nextPage: number) => {
    setSearchParams((current) => {
      const next = new URLSearchParams(current)
      if (nextPage <= 1) next.delete('page')
      else next.set('page', String(nextPage))
      return next
    })
  }
  const exportReport = async (format: 'pdf' | 'xlsx') => {
    setExporting(format)
    setErrorMessage(null)
    try {
      const { blob, filename } = await reportsApi.export(type, format, filters)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (error) {
      setErrorMessage(await exportErrorMessage(error))
    } finally {
      setExporting(null)
      setSearchParams(filtersUrlParams())
    }
  }
  const setFilter = (key: string, value: string) => setFilters((current) => ({ ...current, [key]: value }))
  const setInventoryFilter = (key: string, value: string) => {
    if (value === '1') {
      setFilters((current) => ({ ...current, [key]: value, [key === 'low_stock_only' ? 'out_of_stock_only' : 'low_stock_only']: '' }))
    } else {
      setFilter(key, value)
    }
  }

  const renderFilters = () => (
    <Stack component="form" onSubmit={generate} direction={{ xs: 'column', md: 'row' }} spacing={2} flexWrap="wrap">
      {type === 'sales' && <>
        <TextField size="small" type="date" label="Date from" InputLabelProps={{ shrink: true }} value={filters.date_from ?? ''} onChange={(event) => setFilter('date_from', event.target.value)} />
        <TextField size="small" type="date" label="Date to" InputLabelProps={{ shrink: true }} value={filters.date_to ?? ''} onChange={(event) => setFilter('date_to', event.target.value)} />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="sales-status-label">Status</InputLabel>
          <Select labelId="sales-status-label" label="Status" value={filters.status ?? ''} onChange={(event) => setFilter('status', event.target.value)}>
            <MenuItem value="">All revenue statuses</MenuItem>
            {['pending', 'processing', 'shipped', 'delivered'].map((status) => <MenuItem key={status} value={status}>{status}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id="sales-group-label">Group by</InputLabel>
          <Select labelId="sales-group-label" label="Group by" value={filters.group_by ?? 'day'} onChange={(event) => setFilter('group_by', event.target.value)}>
            <MenuItem value="day">Day</MenuItem><MenuItem value="month">Month</MenuItem>
          </Select>
        </FormControl>
      </>}
      {type === 'product' && <>
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel id="product-category-label">Category</InputLabel>
          <Select labelId="product-category-label" label="Category" value={filters.category ?? ''} onChange={(event) => setFilter('category', event.target.value)}>
            <MenuItem value="">All categories</MenuItem>{categoriesQuery.data?.data.map((category) => <MenuItem key={category.id} value={String(category.id)}>{category.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="product-brand-label">Brand</InputLabel>
          <Select labelId="product-brand-label" label="Brand" value={filters.brand ?? ''} onChange={(event) => setFilter('brand', event.target.value)}>
            <MenuItem value="">All brands</MenuItem>{brandsQuery.data?.data.map((brand) => <MenuItem key={brand.id} value={String(brand.id)}>{brand.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 130 }}>
          <InputLabel id="product-status-label">Status</InputLabel>
          <Select labelId="product-status-label" label="Status" value={filters.status ?? ''} onChange={(event) => setFilter('status', event.target.value)}>
            <MenuItem value="">All statuses</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" type="date" label="Sold from" InputLabelProps={{ shrink: true }} value={filters.date_from ?? ''} onChange={(event) => setFilter('date_from', event.target.value)} />
        <TextField size="small" type="date" label="Sold to" InputLabelProps={{ shrink: true }} value={filters.date_to ?? ''} onChange={(event) => setFilter('date_to', event.target.value)} />
      </>}
      {type === 'inventory' && <>
        <FormControl size="small" sx={{ minWidth: 170 }}>
          <InputLabel id="inventory-category-label">Category</InputLabel>
          <Select labelId="inventory-category-label" label="Category" value={filters.category ?? ''} onChange={(event) => setFilter('category', event.target.value)}>
            <MenuItem value="">All categories</MenuItem>{categoriesQuery.data?.data.map((category) => <MenuItem key={category.id} value={String(category.id)}>{category.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="inventory-brand-label">Brand</InputLabel>
          <Select labelId="inventory-brand-label" label="Brand" value={filters.brand ?? ''} onChange={(event) => setFilter('brand', event.target.value)}>
            <MenuItem value="">All brands</MenuItem>{brandsQuery.data?.data.map((brand) => <MenuItem key={brand.id} value={String(brand.id)}>{brand.name}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControlLabel control={<Checkbox checked={filters.low_stock_only === '1'} onChange={(_, checked) => setInventoryFilter('low_stock_only', checked ? '1' : '')} />} label="Low stock only" />
        <FormControlLabel control={<Checkbox checked={filters.out_of_stock_only === '1'} onChange={(_, checked) => setInventoryFilter('out_of_stock_only', checked ? '1' : '')} />} label="Out of stock only" />
      </>}
      {type === 'customer' && <>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel id="customer-date-scope">Date range of</InputLabel>
          <Select labelId="customer-date-scope" label="Date range of" value={filters.date_scope ?? 'registered'} onChange={(event) => setFilter('date_scope', event.target.value)}>
            <MenuItem value="registered">Registration</MenuItem><MenuItem value="orders">Orders</MenuItem>
          </Select>
        </FormControl>
        <TextField size="small" type="date" label="Date from" InputLabelProps={{ shrink: true }} value={filters.date_from ?? ''} onChange={(event) => setFilter('date_from', event.target.value)} />
        <TextField size="small" type="date" label="Date to" InputLabelProps={{ shrink: true }} value={filters.date_to ?? ''} onChange={(event) => setFilter('date_to', event.target.value)} />
        <TextField size="small" type="number" label="Minimum orders" inputProps={{ min: 0 }} value={filters.min_orders ?? ''} onChange={(event) => setFilter('min_orders', event.target.value)} />
      </>}
      <Button type="submit" variant="contained" startIcon={<TableView />}>Generate</Button>
    </Stack>
  )

  const summary = reportQuery.data?.summary
  const columns = reportQuery.data?.columns ?? {}
  const rows = reportQuery.data?.data ?? []
  const meta = reportQuery.data?.meta

  return (
    <Stack spacing={2.5}>
      <Typography variant="h4" component="h1" fontWeight={700}>Reports</Typography>
      <Tabs value={type} onChange={(_, value: ReportType) => changeTab(value)} variant="scrollable" allowScrollButtonsMobile>
        {reportTabs.map((tab) => <Tab key={tab.key} value={tab.key} label={tab.label} />)}
      </Tabs>
      <Paper variant="outlined" sx={{ p: 2 }}>
        {renderFilters()}
      </Paper>
      <Stack direction="row" spacing={1}>
        <Button variant="outlined" startIcon={exporting === 'pdf' ? <CircularProgress size={16} /> : <Download />} disabled={exporting !== null} onClick={() => void exportReport('pdf')}>Export PDF</Button>
        <Button variant="outlined" startIcon={exporting === 'xlsx' ? <CircularProgress size={16} /> : <Download />} disabled={exporting !== null} onClick={() => void exportReport('xlsx')}>Export Excel</Button>
      </Stack>
      {reportQuery.isError && <Alert severity="error">Unable to generate this report. Check the filters and try again.</Alert>}
      {summary && <Card variant="outlined"><CardContent>
        <Typography variant="h6" fontWeight={700} gutterBottom>{reportQuery.data?.title} Summary</Typography>
        <Box display="grid" gridTemplateColumns={{ xs: '1fr 1fr', md: 'repeat(4, 1fr)' }} gap={2}>
          {Object.entries(summary).filter(([key, value]) => key !== 'status_breakdown' && (typeof value !== 'object' || value === null)).map(([key, value]) => (
            <Box key={key}>
              <Typography variant="caption" color="text.secondary">{key.replaceAll('_', ' ')}</Typography>
              <Typography fontWeight={700}>{moneyKeys.has(key) ? formatCurrency(Number(value)) : Number.isFinite(Number(value)) ? Number(value).toLocaleString() : String(value)}</Typography>
            </Box>
          ))}
        </Box>
        {Array.isArray(summary.status_breakdown) && summary.status_breakdown.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
            {summary.status_breakdown.map((status) => {
              const entry = status as { status: string; order_count: number; grand_total: number }
              return <Typography key={entry.status} variant="body2">{entry.status}: {entry.order_count} ({formatCurrency(entry.grand_total)})</Typography>
            })}
          </Stack>
        )}
        {Array.isArray(summary.period_breakdown) && summary.period_breakdown.length > 0 && (
          <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
            {summary.period_breakdown.map((period) => {
              const entry = period as { period: string; order_count: number; grand_total: number }
              return <Typography key={entry.period} variant="body2">{entry.period}: {entry.order_count} ({formatCurrency(entry.grand_total)})</Typography>
            })}
          </Stack>
        )}
      </CardContent></Card>}
      <Paper variant="outlined">
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table size="small" stickyHeader>
            <TableHead><TableRow>{Object.entries(columns).map(([key, label]) => <TableCell key={key}>{label}</TableCell>)}</TableRow></TableHead>
            <TableBody>
              {reportQuery.isPending
                ? <TableRow><TableCell colSpan={Math.max(Object.keys(columns).length, 1)} align="center">Loading report…</TableCell></TableRow>
                : rows.map((row, index) => (
                  <TableRow key={String(row.id ?? row.order_number ?? row.email ?? index)} hover>
                    {Object.keys(columns).map((key) => (
                      <TableCell key={key}>
                        {moneyKeys.has(key) ? formatCurrency(Number(row[key]))
                          : key.endsWith('_at') && row[key] ? new Date(String(row[key])).toLocaleString()
                            : String(row[key] ?? '—')}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              {!reportQuery.isPending && rows.length === 0 && <TableRow><TableCell colSpan={Math.max(Object.keys(columns).length, 1)} align="center">No rows match these filters.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
        {meta && <TablePagination
          component="div"
          count={meta.total}
          page={meta.current_page - 1}
          rowsPerPage={meta.per_page}
          rowsPerPageOptions={[10]}
          onPageChange={(_, nextPage) => changePage(null, nextPage + 1)}
        />}
      </Paper>
      <Snackbar open={Boolean(errorMessage)} autoHideDuration={7000} onClose={() => setErrorMessage(null)}>
        <Alert severity="error" onClose={() => setErrorMessage(null)}>{errorMessage}</Alert>
      </Snackbar>
    </Stack>
  )
}

export default AdminReportsPage
