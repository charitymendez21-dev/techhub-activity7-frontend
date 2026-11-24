import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Skeleton,
  Stack,
  Typography,
} from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { productApi } from '../api/products'
import ProductCard from '../components/catalog/ProductCard'

function HomePage() {
  const categoriesQuery = useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: productApi.categories,
  })
  const featuredQuery = useQuery({
    queryKey: ['catalog', 'featured'],
    queryFn: productApi.featured,
  })
  const newestQuery = useQuery({
    queryKey: ['catalog', 'newest'],
    queryFn: () => productApi.products({ sort: 'newest', per_page: 8 }),
    placeholderData: keepPreviousData,
  })

  return (
    <Stack spacing={{ xs: 4, md: 6 }}>
      <Box
        sx={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: { xs: 420, md: 390 },
          borderRadius: 3,
          border: '1px solid rgba(125,211,252,.2)',
          p: { xs: 3, md: 6 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1.15fr) minmax(280px, .85fr)' },
          alignItems: 'center',
          color: 'common.white',
          background: 'radial-gradient(circle at 78% 38%, rgba(34,211,238,.18), transparent 24%), linear-gradient(125deg, #0b1f3a 0%, #0b3154 58%, #07111f 100%)',
          boxShadow: '0 24px 80px rgba(2, 132, 199, .12)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            opacity: .2,
            backgroundImage: 'linear-gradient(rgba(125,211,252,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(125,211,252,.14) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            maskImage: 'linear-gradient(90deg, transparent 35%, black)',
          }}
        />
        <Stack spacing={2.2} maxWidth={590} sx={{ position: 'relative', zIndex: 1 }}>
          <Typography variant="overline" color="primary.light" letterSpacing={3}>TECHHUB • Technology for work and play</Typography>
          <Typography variant="h2" component="h1" fontWeight={900} sx={{ fontSize: { xs: '2.35rem', md: '3.75rem' }, lineHeight: 1.02 }}>
            Upgrade your <Box component="span" sx={{ color: 'primary.light' }}>setup.</Box>
          </Typography>
          <Typography variant="h6" color="#c6d5e7" fontWeight={400} sx={{ maxWidth: 520 }}>
            Powerful laptops, gaming gear, smart devices, and everyday essentials engineered for performance.
          </Typography>
          <Stack direction="row" spacing={1.5} sx={{ pt: 1 }}>
            <Button
              component={RouterLink}
              to="/products"
              variant="contained"
              sx={{ px: 3, py: 1.25, fontWeight: 800, boxShadow: '0 10px 30px rgba(34,211,238,.22)' }}
            >
              Shop now
            </Button>
            <Button
              component={RouterLink}
              to="/products"
              variant="outlined"
              sx={{ px: 3, borderColor: 'rgba(125,211,252,.35)', color: 'common.white' }}
            >
              Featured
            </Button>
          </Stack>
        </Stack>
        <Box
          sx={{
            position: 'relative',
            zIndex: 1,
            display: { xs: 'none', md: 'grid' },
            placeItems: 'center',
          }}
        >
          <Box
            component="img"
            src="/techhub-logo.png"
            alt="TECHHUB circuit-board shopping bag"
            sx={{
              width: 'min(330px, 90%)',
              filter: 'drop-shadow(0 24px 32px rgba(34,211,238,.28))',
            }}
          />
        </Box>
      </Box>

      <Box>
        <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={2}>
          <Typography variant="h5" component="h2" fontWeight={800}>Shop by category</Typography>
          <Button component={RouterLink} to="/products" color="primary">View all</Button>
        </Stack>
        {categoriesQuery.isError && <Alert severity="error">Categories could not be loaded.</Alert>}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)', lg: 'repeat(8, 1fr)' }, gap: 1.25 }}>
          {categoriesQuery.isPending
            ? Array.from({ length: 8 }, (_, index) => <Skeleton key={index} variant="rounded" height={112} />)
            : categoriesQuery.data?.slice(0, 8).map((category) => (
              <Card key={category.id} variant="outlined" sx={{ background: 'linear-gradient(145deg, rgba(13,27,45,.96), rgba(7,17,31,.96))', '&:hover': { borderColor: 'primary.main', transform: 'translateY(-3px)' }, transition: 'all .18s ease' }}>
                <CardActionArea component={RouterLink} to={`/products?category=${encodeURIComponent(category.slug)}`}>
                  <CardContent sx={{ minHeight: 112, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <Box
                      sx={{
                        width: 34,
                        height: 34,
                        mb: 1,
                        display: 'grid',
                        placeItems: 'center',
                        borderRadius: 2,
                        border: '1px solid rgba(56,189,248,.28)',
                        background: 'rgba(56,189,248,.08)',
                        color: 'primary.light',
                        fontWeight: 900,
                      }}
                    >
                      {category.name.slice(0, 1)}
                    </Box>
                    <Typography variant="body2" fontWeight={800} sx={{ lineHeight: 1.2 }}>{category.name}</Typography>
                    <Typography variant="body2" color="text.secondary">{category.products_count} products</Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            ))}
        </Box>
      </Box>

      <ProductSection
        title="Featured products"
        products={featuredQuery.data}
        isLoading={featuredQuery.isPending}
        error={featuredQuery.isError}
      />
      <ProductSection
        title="New arrivals"
        products={newestQuery.data?.data}
        isLoading={newestQuery.isPending}
        error={newestQuery.isError}
      />
    </Stack>
  )
}

function ProductSection({
  title,
  products,
  isLoading,
  error,
}: {
  title: string
  products: Awaited<ReturnType<typeof productApi.featured>> | undefined
  isLoading: boolean
  error: boolean
}) {
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={2}>
        <Typography variant="h4" component="h2" fontWeight={700}>{title}</Typography>
        <Button component={RouterLink} to="/products">Browse all</Button>
      </Stack>
      {error && <Alert severity="error">Products could not be loaded.</Alert>}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', md: 'repeat(4, minmax(0, 1fr))' }, gap: 2 }}>
        {isLoading
          ? Array.from({ length: 4 }, (_, index) => <Skeleton key={index} variant="rounded" height={330} />)
          : products?.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} />)}
      </Box>
    </Box>
  )
}

export default HomePage
