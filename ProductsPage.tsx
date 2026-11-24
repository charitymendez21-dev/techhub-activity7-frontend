import { useEffect, useMemo, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { FilterList } from '@mui/icons-material'
import { useSearchParams } from 'react-router-dom'
import { productApi, type ProductQuery } from '../api/products'
import { getErrorMessage } from '../api/client'
import ProductCard from '../components/catalog/ProductCard'
import ProductFilters, { type FilterValues } from '../components/catalog/ProductFilters'
import { useDebouncedValue } from '../hooks/useDebouncedValue'

const productFilterKeys = ['category', 'brand', 'min_price', 'max_price', 'rating', 'in_stock'] as const

function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const searchFromUrl = searchParams.get('search') ?? ''
  const [searchInput, setSearchInput] = useState(searchFromUrl)
  const debouncedSearch = useDebouncedValue(searchInput, 350)

  useEffect(() => setSearchInput(searchFromUrl), [searchFromUrl])

  useEffect(() => {
    if (debouncedSearch === searchFromUrl) return
    const next = new URLSearchParams(searchParams)
    if (debouncedSearch.trim()) next.set('search', debouncedSearch.trim())
    else next.delete('search')
    next.set('page', '1')
    setSearchParams(next, { replace: true })
  }, [debouncedSearch, searchFromUrl, searchParams, setSearchParams])

  const filtersParams = useMemo(() => {
    const params: ProductQuery = {}
    for (const key of productFilterKeys) {
      const value = searchParams.get(key)
      if (value) params[key] = value
    }
    if (searchFromUrl) params.search = searchFromUrl
    return params
  }, [searchFromUrl, searchParams])

  const productsParams = useMemo(() => {
    const params: ProductQuery = { ...filtersParams }
    const sort = searchParams.get('sort')
    const page = searchParams.get('page')
    if (sort) params.sort = sort
    if (page) params.page = Number(page)
    params.per_page = 12
    return params
  }, [filtersParams, searchParams])

  const productsQuery = useQuery({
    queryKey: ['catalog', 'products', productsParams],
    queryFn: () => productApi.products(productsParams),
    placeholderData: keepPreviousData,
  })
  const categoriesQuery = useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: productApi.categories,
    staleTime: 5 * 60 * 1000,
  })
  const filterOptionsQuery = useQuery({
    queryKey: ['catalog', 'filter-options', filtersParams],
    queryFn: () => productApi.filters(filtersParams),
    placeholderData: keepPreviousData,
  })

  const bounds = filterOptionsQuery.data?.price ?? { min: 0, max: 0 }
  const minBound = bounds.min
  const maxBound = bounds.max
  const [priceDraft, setPriceDraft] = useState<[number, number]>([minBound, maxBound])
  const priceQuery = searchParams.toString()

  useEffect(() => {
    const from = searchParams.get('min_price')
    const to = searchParams.get('max_price')
    const minimum = from === null ? minBound : Number(from)
    const maximum = to === null ? maxBound : Number(to)
    setPriceDraft([
      Math.max(minBound, Math.min(minimum, maxBound)),
      Math.max(Math.max(minBound, Math.min(minimum, maxBound)), Math.min(maximum, maxBound)),
    ])
  }, [maxBound, minBound, priceQuery, searchParams])

  const debouncedPrice = useDebouncedValue(priceDraft, 400)
  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (debouncedPrice[0] > minBound) next.set('min_price', String(debouncedPrice[0]))
    else next.delete('min_price')
    if (debouncedPrice[1] < maxBound) next.set('max_price', String(debouncedPrice[1]))
    else next.delete('max_price')
    if (next.toString() !== searchParams.toString()) {
      next.set('page', '1')
      setSearchParams(next, { replace: true })
    }
  }, [debouncedPrice, maxBound, minBound, searchParams, setSearchParams])

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.set('page', '1')
    setSearchParams(next)
  }

  function updateFilters(values: FilterValues) {
    const next = new URLSearchParams(searchParams)
    if (values.category) next.set('category', values.category)
    else next.delete('category')
    if (values.brands.length) next.set('brand', values.brands.join(','))
    else next.delete('brand')
    if (values.rating) next.set('rating', values.rating)
    else next.delete('rating')
    if (values.inStock) next.set('in_stock', '1')
    else next.delete('in_stock')
    next.set('page', '1')
    setSearchParams(next)
  }

  function updatePrice(minimum: number, maximum: number) {
    setPriceDraft([minimum, maximum])
  }

  function clearFilters() {
    const next = new URLSearchParams(searchParams)
    for (const key of productFilterKeys) next.delete(key)
    next.set('page', '1')
    setSearchParams(next)
    setPriceDraft([minBound, maxBound])
  }

  const filterValues: FilterValues = {
    category: searchParams.get('category') ?? '',
    brands: (searchParams.get('brand') ?? '').split(',').filter(Boolean),
    minimum: priceDraft[0],
    maximum: priceDraft[1],
    rating: searchParams.get('rating') ?? '',
    inStock: searchParams.get('in_stock') === '1',
  }
  const categories = categoriesQuery.data ?? []
  const brands = filterOptionsQuery.data?.brands ?? []
  const rows = productsQuery.data?.data ?? []
  const page = Math.max(1, Number(searchParams.get('page') ?? 1))

  const filters = (
    <ProductFilters
      categories={categories}
      categoriesLoaded={categoriesQuery.isSuccess}
      brands={brands}
      minBound={minBound}
      maxBound={maxBound}
      values={filterValues}
      onChange={updateFilters}
      onPriceChange={updatePrice}
      onClear={clearFilters}
    />
  )

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h3" component="h1" fontWeight={800} sx={{ fontSize: { xs: '2rem', md: '2.5rem' } }}>
          Products
        </Typography>
        <Typography color="text.secondary">Find the right thing for your everyday.</Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
        <TextFieldSearch value={searchInput} onChange={setSearchInput} />
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="catalog-sort-label">Sort by</InputLabel>
          <Select
            labelId="catalog-sort-label"
            label="Sort by"
            value={searchParams.get('sort') ?? 'newest'}
            onChange={(event) => updateParam('sort', event.target.value)}
          >
            <MenuItem value="newest">Newest</MenuItem>
            <MenuItem value="price_asc">Price: low to high</MenuItem>
            <MenuItem value="price_desc">Price: high to low</MenuItem>
            <MenuItem value="best_selling">Best selling</MenuItem>
            <MenuItem value="highest_rating">Top rated</MenuItem>
          </Select>
        </FormControl>
        <Button
          startIcon={<FilterList />}
          variant="outlined"
          onClick={() => setMobileFiltersOpen(true)}
          sx={{ display: { md: 'none' } }}
        >
          Filters
        </Button>
      </Stack>

      {productsQuery.isError && <Alert severity="error">{getErrorMessage(productsQuery.error)}</Alert>}
      {filterOptionsQuery.isError && <Alert severity="warning">Filter options could not be loaded.</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '260px minmax(0, 1fr)' }, gap: 3 }}>
        <Paper sx={{ p: 2, alignSelf: 'start', display: { xs: 'none', md: 'block' } }}>
          {filters}
        </Paper>
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            {productsQuery.isPlaceholderData ? 'Updating results…' : `${productsQuery.data?.meta.total ?? 0} products`}
          </Typography>
          {productsQuery.isPending ? (
            <ProductSkeletons />
          ) : rows.length ? (
            <>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
                {rows.map((product) => <ProductCard key={product.id} product={product} />)}
              </Box>
              <Stack alignItems="center" sx={{ mt: 4 }}>
                <Pagination
                  page={page}
                  count={productsQuery.data?.meta.last_page ?? 1}
                  color="primary"
                  onChange={(_, selectedPage) => updateParam('page', String(selectedPage))}
                />
              </Stack>
            </>
          ) : (
            <Paper variant="outlined" sx={{ p: 5, textAlign: 'center' }}>
              <Typography variant="h6">No products found</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>Try changing your search or filters.</Typography>
              <Button onClick={clearFilters} sx={{ mt: 2 }}>Clear filters</Button>
            </Paper>
          )}
        </Box>
      </Box>

      <Drawer open={mobileFiltersOpen} onClose={() => setMobileFiltersOpen(false)}>
        <Box sx={{ width: { xs: 'min(88vw, 360px)' }, p: 2.5 }}>
          {filters}
          <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={() => setMobileFiltersOpen(false)}>
            Show results
          </Button>
        </Box>
      </Drawer>
    </Stack>
  )
}

function TextFieldSearch({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <TextField
      size="small"
      label="Search products"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      sx={{ flexGrow: 1 }}
    />
  )
}

function ProductSkeletons() {
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' }, gap: 2 }}>
      {Array.from({ length: 9 }, (_, index) => (
        <Box key={index}>
          <Skeleton variant="rounded" height={220} />
          <Skeleton width="75%" sx={{ mt: 1 }} />
          <Skeleton width="50%" />
          <Skeleton width="60%" />
        </Box>
      ))}
    </Box>
  )
}

export default ProductsPage
