import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { ArrowBack, DeleteOutline, PhotoCamera } from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import { adminApi, getAdminError, getFieldErrors, type Product } from '../../api/admin'
import ProductImage from '../../components/catalog/ProductImage'

type ProductValues = {
  name: string
  sku: string
  category_id: string
  brand_id: string
  description: string
  price: string
  sale_price: string
  stock_quantity: string
  low_stock_threshold: string
  is_featured: boolean
  status: 'active' | 'inactive'
  inventory_reason: string
}

const initialValues: ProductValues = {
  name: '',
  sku: '',
  category_id: '',
  brand_id: '',
  description: '',
  price: '',
  sale_price: '',
  stock_quantity: '0',
  low_stock_threshold: '5',
  is_featured: false,
  status: 'active',
  inventory_reason: '',
}

function ProductFormPage() {
  const { productId } = useParams()
  const id = productId ? Number(productId) : null
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [values, setValues] = useState<ProductValues>(initialValues)
  const [newImages, setNewImages] = useState<File[]>([])
  const [sortOrders, setSortOrders] = useState<number[]>([])
  const [primarySelection, setPrimarySelection] = useState('')
  const [newBrandName, setNewBrandName] = useState('')
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)
  const initializedProductId = useRef<number | null>(null)

  const productQuery = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: ({ signal }) => adminApi.product(id!, signal),
    enabled: id !== null,
  })
  const categoriesQuery = useQuery({
    queryKey: ['admin', 'category-options'],
    queryFn: () => adminApi.categories({ per_page: 100 }),
  })
  const brandsQuery = useQuery({
    queryKey: ['admin', 'brands'],
    queryFn: () => adminApi.brands({ per_page: 100 }),
  })

  useEffect(() => {
    const product = productQuery.data
    if (!product || initializedProductId.current === product.id) return
    initializedProductId.current = product.id

    setValues({
      name: product.name,
      sku: product.sku,
      category_id: String(product.category_id),
      brand_id: product.brand_id ? String(product.brand_id) : '',
      description: product.description ?? '',
      price: product.price,
      sale_price: product.sale_price ?? '',
      stock_quantity: String(product.stock_quantity),
      low_stock_threshold: String(product.low_stock_threshold),
      is_featured: product.is_featured,
      status: product.status,
      inventory_reason: '',
    })
    const primaryImage = product.images.find((item) => item.is_primary)
    setPrimarySelection(primaryImage ? `existing-${primaryImage.id}` : '')
  }, [productQuery.data])

  const previews = useMemo(() => newImages.map((file) => URL.createObjectURL(file)), [newImages])
  useEffect(() => () => previews.forEach((url) => URL.revokeObjectURL(url)), [previews])

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = new FormData()
      body.append('name', values.name)
      body.append('sku', values.sku)
      body.append('category_id', values.category_id)
      body.append('brand_id', values.brand_id)
      body.append('description', values.description)
      body.append('price', values.price)
      body.append('sale_price', values.sale_price)
      body.append('stock_quantity', values.stock_quantity)
      body.append('low_stock_threshold', values.low_stock_threshold)
      body.append('is_featured', values.is_featured ? '1' : '0')
      body.append('status', values.status)
      if (values.inventory_reason) body.append('inventory_reason', values.inventory_reason)
      newImages.forEach((file, index) => {
        body.append(`images[${index}]`, file)
        body.append(`image_sort_orders[${index}]`, String(sortOrders[index] ?? index))
      })

      const existingPrimaryId = primarySelection.startsWith('existing-')
        ? primarySelection.slice('existing-'.length)
        : null
      const newPrimaryIndex = primarySelection.startsWith('new-')
        ? primarySelection.slice('new-'.length)
        : null
      if (existingPrimaryId) body.append('primary_image_id', existingPrimaryId)
      if (newPrimaryIndex !== null) body.append('primary_image_index', newPrimaryIndex)

      return id ? adminApi.updateProduct(id, body) : adminApi.createProduct(body)
    },
    onSuccess: (product) => {
      queryClient.setQueryData(['admin', 'product', product.id], product)
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] })
      setFeedback({ message: id ? 'Product updated.' : 'Product created.', severity: 'success' })
      if (!id) navigate(`/admin/products/${product.id}/edit`, { replace: true })
    },
    onError: (error) => setFeedback({ message: getAdminError(error), severity: 'error' }),
  })

  const brandMutation = useMutation({
    mutationFn: () => adminApi.createBrand(newBrandName.trim()),
    onSuccess: (brand) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] })
      setValues((current) => ({ ...current, brand_id: String(brand.id) }))
      setNewBrandName('')
      setFeedback({ message: 'Brand created.', severity: 'success' })
    },
    onError: (error) => setFeedback({ message: getAdminError(error), severity: 'error' }),
  })

  const removeImageMutation = useMutation({
    mutationFn: (imageId: number) => adminApi.deleteProductImage(id!, imageId),
    onSuccess: (_, imageId) => {
      const current = queryClient.getQueryData<Product>(['admin', 'product', id])
      if (!current) return
      const images = current.images.filter((image) => image.id !== imageId)
      queryClient.setQueryData<Product>(['admin', 'product', id], { ...current, images })
      if (primarySelection === `existing-${imageId}`) {
        const nextPrimary = images.find((image) => image.is_primary) ?? images[0]
        setPrimarySelection(nextPrimary ? `existing-${nextPrimary.id}` : '')
      }
      setFeedback({ message: 'Image removed.', severity: 'success' })
    },
    onError: (error) => setFeedback({ message: getAdminError(error), severity: 'error' }),
  })

  const errors = getFieldErrors(saveMutation.error)
  const product = productQuery.data

  function changeValue<K extends keyof ProductValues>(key: K, value: ProductValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function addImages(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? [])
    const remaining = Math.max(0, 6 - (product?.images.length ?? 0) - newImages.length)
    const accepted = selected.slice(0, remaining)
    if (selected.length > remaining) {
      setFeedback({ message: `You can add only ${remaining} more image(s).`, severity: 'error' })
    }
    setNewImages((current) => [...current, ...accepted])
    setSortOrders((current) => [
      ...current,
      ...accepted.map((_, index) => (product?.images.length ?? 0) + current.length + index),
    ])
    event.target.value = ''
  }

  function removeNewImage(index: number) {
    setNewImages((current) => current.filter((_, itemIndex) => itemIndex !== index))
    setSortOrders((current) => current.filter((_, itemIndex) => itemIndex !== index))
    if (primarySelection === `new-${index}`) setPrimarySelection('')
    if (primarySelection.startsWith('new-') && Number(primarySelection.slice(4)) > index) {
      setPrimarySelection(`new-${Number(primarySelection.slice(4)) - 1}`)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveMutation.mutate()
  }

  if ((productQuery.isPending && id !== null) || categoriesQuery.isPending || brandsQuery.isPending) {
    return <Box sx={{ minHeight: 300, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
  }

  if (productQuery.isError) {
    return <Alert severity="error">{getAdminError(productQuery.error)}</Alert>
  }

  const allImageCount = (product?.images.length ?? 0) + newImages.length

  return (
    <Stack spacing={2.5}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/admin/products')} sx={{ alignSelf: 'flex-start' }}>
        Back to products
      </Button>
      <Box>
        <Typography variant="h4" component="h1" fontWeight={700}>{id ? 'Edit product' : 'Create product'}</Typography>
        <Typography color="text.secondary">Product details, pricing, inventory, and images.</Typography>
      </Box>

      <Paper component="form" onSubmit={submit} sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={3}>
          {saveMutation.isError && <Alert severity="error">{getAdminError(saveMutation.error)}</Alert>}
          {(categoriesQuery.isError || brandsQuery.isError) && <Alert severity="error">Unable to load categories or brands.</Alert>}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <TextField label="Product name" value={values.name} onChange={(event) => changeValue('name', event.target.value)} error={Boolean(errors.name)} helperText={errors.name} required />
            <TextField label="SKU" value={values.sku} onChange={(event) => changeValue('sku', event.target.value)} error={Boolean(errors.sku)} helperText={errors.sku} required />
            <FormControl required error={Boolean(errors.category_id)}>
              <InputLabel id="product-category-label">Category</InputLabel>
              <Select labelId="product-category-label" label="Category" value={values.category_id} onChange={(event) => changeValue('category_id', event.target.value)}>
                {(categoriesQuery.data?.data ?? []).map((category) => <MenuItem key={category.id} value={String(category.id)}>{category.name}</MenuItem>)}
              </Select>
              {errors.category_id && <Typography variant="caption" color="error">{errors.category_id}</Typography>}
            </FormControl>
            <FormControl error={Boolean(errors.brand_id)}>
              <InputLabel id="product-brand-label">Brand</InputLabel>
              <Select labelId="product-brand-label" label="Brand" value={values.brand_id} onChange={(event) => changeValue('brand_id', event.target.value)}>
                <MenuItem value="">No brand</MenuItem>
                {(brandsQuery.data?.data ?? []).map((brand) => <MenuItem key={brand.id} value={String(brand.id)}>{brand.name}</MenuItem>)}
              </Select>
              {errors.brand_id && <FormHelperText>{errors.brand_id}</FormHelperText>}
            </FormControl>
          </Box>

          <Card variant="outlined">
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>Add a brand</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField size="small" label="New brand name" value={newBrandName} onChange={(event) => setNewBrandName(event.target.value)} />
                <Button variant="outlined" disabled={!newBrandName.trim() || brandMutation.isPending} onClick={() => brandMutation.mutate()}>
                  {brandMutation.isPending ? 'Adding…' : 'Add brand'}
                </Button>
              </Stack>
            </CardContent>
          </Card>

          <TextField label="Description" value={values.description} onChange={(event) => changeValue('description', event.target.value)} error={Boolean(errors.description)} helperText={errors.description} multiline minRows={4} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <TextField label="Price" type="number" value={values.price} onChange={(event) => changeValue('price', event.target.value)} error={Boolean(errors.price)} helperText={errors.price} inputProps={{ min: 0.01, step: 0.01 }} required />
            <TextField label="Sale price" type="number" value={values.sale_price} onChange={(event) => changeValue('sale_price', event.target.value)} error={Boolean(errors.sale_price)} helperText={errors.sale_price} inputProps={{ min: 0.01, step: 0.01 }} />
            <TextField label="Stock quantity" type="number" value={values.stock_quantity} onChange={(event) => changeValue('stock_quantity', event.target.value)} error={Boolean(errors.stock_quantity)} helperText={errors.stock_quantity} inputProps={{ min: 0, step: 1 }} required />
            <TextField label="Low stock threshold" type="number" value={values.low_stock_threshold} onChange={(event) => changeValue('low_stock_threshold', event.target.value)} error={Boolean(errors.low_stock_threshold)} helperText={errors.low_stock_threshold} inputProps={{ min: 0, step: 1 }} required />
          </Box>
          {errors.inventory_reason && (
            <TextField label="Reason for stock change" value={values.inventory_reason} onChange={(event) => changeValue('inventory_reason', event.target.value)} error helperText={errors.inventory_reason} required />
          )}
          {id && values.stock_quantity !== String(product?.stock_quantity) && !errors.inventory_reason && (
            <TextField label="Reason for stock change" value={values.inventory_reason} onChange={(event) => changeValue('inventory_reason', event.target.value)} error={Boolean(errors.inventory_reason)} helperText="Required when changing stock." required />
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
            <FormControl error={Boolean(errors.status)}>
              <InputLabel id="product-status-label">Status</InputLabel>
              <Select labelId="product-status-label" label="Status" value={values.status} onChange={(event) => changeValue('status', event.target.value as ProductValues['status'])}>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
              {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
            </FormControl>
            <Box>
              <FormControlLabel control={<Checkbox checked={values.is_featured} onChange={(event) => changeValue('is_featured', event.target.checked)} />} label="Featured product" />
              {errors.is_featured && <FormHelperText error>{errors.is_featured}</FormHelperText>}
            </Box>
          </Box>

          <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={1}>
              <Box>
                <Typography variant="h6">Product images</Typography>
                <Typography variant="body2" color="text.secondary">JPG, PNG, or WebP; up to 2 MB each and 6 images total. Choose one primary image.</Typography>
              </Box>
              <Button component="label" variant="outlined" startIcon={<PhotoCamera />} disabled={allImageCount >= 6}>
                Add images
                <input hidden type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addImages} />
              </Button>
            </Stack>
            {errors.images && <Typography color="error" variant="body2" sx={{ mt: 1 }}>{errors.images}</Typography>}
            <RadioGroup value={primarySelection} onChange={(event) => setPrimarySelection(event.target.value)}>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 1.5, mt: 2 }}>
                {(product?.images ?? []).map((image) => (
                  <Card variant="outlined" key={`existing-${image.id}`}>
                    <Box sx={{ width: '100%', height: 130 }}>
                      <ProductImage src={image.url} alt={values.name || 'Product'} />
                    </Box>
                    <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <FormControlLabel value={`existing-${image.id}`} control={<Radio size="small" />} label="Primary" />
                        <IconButton aria-label="Remove image" size="small" onClick={() => removeImageMutation.mutate(image.id)} disabled={removeImageMutation.isPending}>
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Stack>
                      {image.is_primary && <Typography variant="caption" color="primary">Current primary</Typography>}
                    </CardContent>
                  </Card>
                ))}
                {newImages.map((file, index) => (
                  <Card variant="outlined" key={`${file.name}-${index}`}>
                    <Box sx={{ width: '100%', height: 130 }}>
                      <ProductImage src={previews[index]} alt={file.name} />
                    </Box>
                    <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                      <Typography variant="caption" noWrap display="block">{file.name}</Typography>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <FormControlLabel value={`new-${index}`} control={<Radio size="small" />} label="Primary" />
                        <IconButton aria-label="Remove selected image" size="small" onClick={() => removeNewImage(index)}>
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Stack>
                      <TextField
                        label="Sort order"
                        type="number"
                        size="small"
                        value={sortOrders[index] ?? index}
                        onChange={(event) => setSortOrders((current) => current.map((value, itemIndex) => itemIndex === index ? Number(event.target.value) : value))}
                        inputProps={{ min: 0, step: 1 }}
                        fullWidth
                      />
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </RadioGroup>
            {(errors.primary_image_index || errors.primary_image_id || errors.image_sort_orders) && (
              <FormHelperText error>
                {errors.primary_image_index || errors.primary_image_id || errors.image_sort_orders}
              </FormHelperText>
            )}
          </Box>

          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button onClick={() => navigate('/admin/products')}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : id ? 'Save changes' : 'Create product'}
            </Button>
          </Stack>
        </Stack>
      </Paper>
      <Snackbar open={Boolean(feedback)} autoHideDuration={4500} onClose={() => setFeedback(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        {feedback ? <Alert severity={feedback.severity} onClose={() => setFeedback(null)}>{feedback.message}</Alert> : undefined}
      </Snackbar>
    </Stack>
  )
}

export default ProductFormPage
