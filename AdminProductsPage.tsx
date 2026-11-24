import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { Add, DeleteOutline, EditOutlined, RestoreOutlined } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { adminApi, getAdminError, type Product } from '../../api/admin'
import { priceFormatter } from '../../config/store'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import ProductImage from '../../components/catalog/ProductImage'

function AdminProductsPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [category, setCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [status, setStatus] = useState('')
  const [lowStock, setLowStock] = useState(false)
  const [showDeleted, setShowDeleted] = useState(false)
  const [page, setPage] = useState(0)
  const [deleting, setDeleting] = useState<Product | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const params = useMemo(() => ({
    search: debouncedSearch || undefined,
    category: category || undefined,
    brand: brand || undefined,
    status: status || undefined,
    low_stock: lowStock ? 1 : undefined,
    trashed: showDeleted ? 'with' : undefined,
    sort: 'newest',
    page: page + 1,
    per_page: 10,
  }), [brand, category, debouncedSearch, lowStock, page, showDeleted, status])
  const productsQuery = useQuery({
    queryKey: ['admin', 'products', params],
    queryFn: () => adminApi.products(params),
    placeholderData: keepPreviousData,
  })
  const categoriesQuery = useQuery({
    queryKey: ['admin', 'category-options'],
    queryFn: () => adminApi.categories({ per_page: 100 }),
  })
  const brandsQuery = useQuery({
    queryKey: ['admin', 'brands'],
    queryFn: () => adminApi.brands({ per_page: 100 }),
  })
  const deleteMutation = useMutation({
    mutationFn: (product: Product) => adminApi.deleteProduct(product.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      setDeleting(null)
      setFeedback({ message: 'Product moved to deleted items.', severity: 'success' })
    },
    onError: (error) => {
      setDeleting(null)
      setFeedback({ message: getAdminError(error), severity: 'error' })
    },
  })
  const restoreMutation = useMutation({
    mutationFn: (product: Product) => adminApi.restoreProduct(product.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      setFeedback({ message: 'Product restored.', severity: 'success' })
    },
    onError: (error) => setFeedback({ message: getAdminError(error), severity: 'error' }),
  })
  const rows = productsQuery.data?.data ?? []

  function resetPage(action: () => void) {
    action()
    setPage(0)
  }

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700}>Products</Typography>
          <Typography color="text.secondary">Manage catalog details, pricing, images, and inventory.</Typography>
        </Box>
        <Button startIcon={<Add />} variant="contained" onClick={() => navigate('/admin/products/new')}>Add product</Button>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <TextField
              label="Search name, SKU, or brand"
              value={search}
              onChange={(event) => resetPage(() => setSearch(event.target.value))}
              size="small"
              sx={{ flexGrow: 1 }}
            />
            <FormControl size="small" sx={{ minWidth: 170 }}>
              <InputLabel id="product-category-filter">Category</InputLabel>
              <Select labelId="product-category-filter" label="Category" value={category} onChange={(event) => resetPage(() => setCategory(event.target.value))}>
                <MenuItem value="">All categories</MenuItem>
                {(categoriesQuery.data?.data ?? []).map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 160 }}>
              <InputLabel id="product-brand-filter">Brand</InputLabel>
              <Select labelId="product-brand-filter" label="Brand" value={brand} onChange={(event) => resetPage(() => setBrand(event.target.value))}>
                <MenuItem value="">All brands</MenuItem>
                {(brandsQuery.data?.data ?? []).map((item) => <MenuItem key={item.id} value={item.id}>{item.name}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ minWidth: 145 }}>
              <InputLabel id="product-status-filter">Status</InputLabel>
              <Select labelId="product-status-filter" label="Status" value={status} onChange={(event) => resetPage(() => setStatus(event.target.value))}>
                <MenuItem value="">All statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          <Stack direction="row" spacing={2}>
            <FormControlLabel control={<Switch checked={lowStock} onChange={(event) => resetPage(() => setLowStock(event.target.checked))} />} label="Low stock only" />
            <FormControlLabel control={<Switch checked={showDeleted} onChange={(event) => resetPage(() => setShowDeleted(event.target.checked))} />} label="Show deleted" />
          </Stack>
        </Stack>
      </Paper>

      {productsQuery.isError && <Alert severity="error">{getAdminError(productsQuery.error)}</Alert>}
      {(categoriesQuery.isError || brandsQuery.isError) && <Alert severity="warning">Some filter options could not be loaded.</Alert>}
      <Paper>
        <TableContainer>
          <Table sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Category / Brand</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Featured</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {productsQuery.isPending ? (
                <TableRow><TableCell colSpan={7} align="center"><CircularProgress size={28} sx={{ my: 2 }} /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={7} align="center">No products found.</TableCell></TableRow>
              ) : rows.map((product) => {
                const thumbnail = product.images.find((item) => item.is_primary)?.url ?? product.images[0]?.url
                return (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ width: 52, height: 52, borderRadius: 1, overflow: 'hidden', flexShrink: 0 }}>
                          <ProductImage src={thumbnail} alt={product.name} />
                        </Box>
                        <Box>
                          <Typography fontWeight={600}>{product.name}</Typography>
                          <Typography variant="caption" color="text.secondary">SKU: {product.sku}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{product.category?.name ?? '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{product.brand?.name ?? 'No brand'}</Typography>
                    </TableCell>
                    <TableCell>
                      {product.sale_price ? (
                        <Stack>
                          <Typography fontWeight={600}>{priceFormatter.format(Number(product.sale_price))}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ textDecoration: 'line-through' }}>{priceFormatter.format(Number(product.price))}</Typography>
                        </Stack>
                      ) : priceFormatter.format(Number(product.price))}
                    </TableCell>
                    <TableCell>
                      <Chip size="small" label={product.stock_quantity} color={product.is_low_stock ? 'warning' : 'default'} />
                    </TableCell>
                    <TableCell>
                      {product.deleted_at ? <Chip size="small" label="Deleted" /> : <Chip size="small" label={product.status} color={product.status === 'active' ? 'success' : 'default'} />}
                    </TableCell>
                    <TableCell>{product.is_featured ? <Chip size="small" label="Featured" color="primary" /> : '—'}</TableCell>
                    <TableCell align="right">
                      {product.deleted_at ? (
                        <Tooltip title="Restore">
                          <IconButton aria-label={`Restore ${product.name}`} onClick={() => restoreMutation.mutate(product)} disabled={restoreMutation.isPending}><RestoreOutlined /></IconButton>
                        </Tooltip>
                      ) : (
                        <>
                          <Tooltip title="Edit">
                            <IconButton aria-label={`Edit ${product.name}`} onClick={() => navigate(`/admin/products/${product.id}/edit`)}><EditOutlined /></IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton aria-label={`Delete ${product.name}`} onClick={() => setDeleting(product)}><DeleteOutline /></IconButton>
                          </Tooltip>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={productsQuery.data?.meta.total ?? 0}
          page={page}
          rowsPerPage={10}
          rowsPerPageOptions={[10]}
          onPageChange={(_, nextPage) => setPage(nextPage)}
        />
      </Paper>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete product?"
        message={`Delete "${deleting?.name}"? It can be restored later.`}
        busy={deleteMutation.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
      <Snackbar open={Boolean(feedback)} autoHideDuration={4500} onClose={() => setFeedback(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {feedback ? <Alert severity={feedback.severity} onClose={() => setFeedback(null)}>{feedback.message}</Alert> : undefined}
      </Snackbar>
    </Stack>
  )
}

export default AdminProductsPage
