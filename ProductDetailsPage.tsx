import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  FormHelperText,
  IconButton,
  LinearProgress,
  Link,
  Pagination,
  Paper,
  Rating,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Add, Remove } from '@mui/icons-material'
import { Link as RouterLink, useLocation, useNavigate, useParams } from 'react-router-dom'
import { getErrorMessage } from '../api/client'
import { cartApi } from '../api/cart'
import { cartQueryKey } from '../hooks/useCart'
import { useAuthUser } from '../hooks/useAuthUser'
import { productApi } from '../api/products'
import { reviewsApi } from '../api/reviews'
import { getFieldErrors } from '../api/admin'
import PriceTag from '../components/catalog/PriceTag'
import RatingStars from '../components/catalog/RatingStars'
import ConfirmDialog from '../components/ConfirmDialog'
import ProductImage from '../components/catalog/ProductImage'
import productActionButtonSx from '../components/catalog/productActionButtonSx'

function ProductDetailsPage() {
  const { slug = '' } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [selectedImage, setSelectedImage] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [reviewPage, setReviewPage] = useState(1)
  const [cartMessage, setCartMessage] = useState('')
  const [reviewMessage, setReviewMessage] = useState('')
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [editingReview, setEditingReview] = useState(false)
  const [confirmReviewDelete, setConfirmReviewDelete] = useState(false)
  const productQuery = useQuery({
    queryKey: ['catalog', 'product', slug],
    queryFn: () => productApi.product(slug),
    enabled: Boolean(slug),
    retry: false,
  })
  const reviewsQuery = useQuery({
    queryKey: ['catalog', 'reviews', slug, reviewPage],
    queryFn: () => productApi.reviews(slug, reviewPage),
    enabled: Boolean(slug) && Boolean(productQuery.data),
    retry: false,
  })
  const userQuery = useAuthUser()
  const eligibilityQuery = useQuery({
    queryKey: ['catalog', 'review-eligibility', productQuery.data?.id],
    queryFn: () => reviewsApi.eligibility(productQuery.data!.id),
    enabled: Boolean(productQuery.data?.id) && userQuery.data?.role === 'customer',
  })
  const addMutation = useMutation({
    mutationFn: () => cartApi.add(productQuery.data?.id ?? 0, quantity),
    onSuccess: (cart) => {
      queryClient.setQueryData(cartQueryKey, cart)
      setCartMessage('Added to your cart.')
    },
    onError: (error) => setCartMessage(getErrorMessage(error)),
  })
  const reviewMutation = useMutation({
    mutationFn: () => eligibilityQuery.data?.my_review
      ? reviewsApi.update(eligibilityQuery.data.my_review.id, { rating: reviewRating, comment: reviewComment })
      : reviewsApi.create(productQuery.data!.id, { rating: reviewRating, comment: reviewComment }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['catalog', 'review-eligibility', productQuery.data!.id] }),
        queryClient.invalidateQueries({ queryKey: ['catalog', 'reviews', slug] }),
        queryClient.invalidateQueries({ queryKey: ['catalog', 'product', slug] }),
      ])
      setEditingReview(false)
      setReviewMessage('Your review has been saved.')
    },
    onError: (error) => setReviewMessage(getErrorMessage(error)),
  })
  const deleteReviewMutation = useMutation({
    mutationFn: () => reviewsApi.remove(eligibilityQuery.data?.my_review?.id ?? 0),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['catalog', 'review-eligibility', productQuery.data!.id] }),
        queryClient.invalidateQueries({ queryKey: ['catalog', 'reviews', slug] }),
        queryClient.invalidateQueries({ queryKey: ['catalog', 'product', slug] }),
      ])
      setConfirmReviewDelete(false)
      setEditingReview(false)
      setReviewMessage('Your review has been deleted.')
    },
    onError: (error) => setReviewMessage(getErrorMessage(error)),
  })
  const reviewErrors = getFieldErrors(reviewMutation.error)

  useEffect(() => {
    setSelectedImage('')
    setQuantity(1)
    setReviewPage(1)
    setEditingReview(false)
  }, [slug])

  useEffect(() => {
    const review = eligibilityQuery.data?.my_review
    if (!review) {
      setReviewRating(5)
      setReviewComment('')
      return
    }
    setReviewRating(review.rating)
    setReviewComment(review.comment ?? '')
  }, [eligibilityQuery.data?.my_review])

  if (productQuery.isPending) {
    return <Box sx={{ minHeight: 360, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
  }

  if (productQuery.isError) {
    const notFound = axios.isAxiosError(productQuery.error) && productQuery.error.response?.status === 404
    return (
      <Paper sx={{ p: 5, textAlign: 'center' }}>
        <Typography variant="h4" component="h1">{notFound ? 'Product not found' : 'Unable to load product'}</Typography>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {notFound ? 'This product may be unavailable or no longer active.' : getErrorMessage(productQuery.error)}
        </Typography>
        <Button component={RouterLink} to="/products" variant="contained" sx={{ mt: 2 }}>Browse products</Button>
      </Paper>
    )
  }

  const product = productQuery.data
  const images = product.images
  const activeImage = images.find((image) => image.url === selectedImage)
    ?? images.find((image) => image.is_primary)
    ?? images[0]
  const stockStatus = product.stock_quantity <= 0
    ? { label: 'Out of stock', color: 'default' as const }
    : product.stock_quantity <= product.low_stock_threshold
      ? { label: `Low stock (${product.stock_quantity} left)`, color: 'warning' as const }
      : { label: 'In stock', color: 'success' as const }

  function addToCart() {
    if (userQuery.data?.role !== 'customer') {
      const returnUrl = `${location.pathname}${location.search}`
      navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
      return
    }

    addMutation.mutate()
  }

  return (
    <Stack spacing={3}>
      <Breadcrumbs aria-label="Breadcrumb">
        <Link component={RouterLink} underline="hover" color="inherit" to="/">Home</Link>
        <Link
          component={RouterLink}
          underline="hover"
          color="inherit"
          to={`/products?category=${encodeURIComponent(product.category.slug)}`}
        >
          {product.category.name}
        </Link>
        <Typography color="text.primary">{product.name}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(0, 0.9fr)' }, gap: { xs: 3, md: 5 } }}>
        <Box>
          <Box sx={{ height: { xs: 300, md: 500 }, borderRadius: 3, overflow: 'hidden' }}>
            <ProductImage src={activeImage?.url ?? product.image_url} alt={product.name} />
          </Box>
          {images.length > 1 && (
            <Stack direction="row" spacing={1} sx={{ mt: 1.5, overflowX: 'auto' }}>
              {images.map((image) => (
                <IconButton
                  key={image.id}
                  aria-label={`View image ${image.sort_order + 1}`}
                  onClick={() => setSelectedImage(image.url)}
                  sx={{ p: 0.5, border: 2, borderColor: activeImage?.id === image.id ? 'primary.main' : 'transparent' }}
                >
                  <Box sx={{ width: 76, height: 76, borderRadius: 1, overflow: 'hidden' }}>
                    <ProductImage src={image.url} alt={`${product.name} image ${image.sort_order + 1}`} />
                  </Box>
                </IconButton>
              ))}
            </Stack>
          )}
        </Box>

        <Stack spacing={2} sx={{ alignSelf: 'start' }}>
          <Typography variant="overline" color="text.secondary">
            {product.brand?.name ?? product.category.name}
          </Typography>
          <Typography variant="h3" component="h1" fontWeight={800} sx={{ fontSize: { xs: '2rem', md: '2.6rem' } }}>
            {product.name}
          </Typography>
          <RatingStars rating={product.rating} count={product.reviews_count} size="medium" />
          <PriceTag price={product.price} salePrice={product.sale_price} size="h5" />
          <Chip label={stockStatus.label} color={stockStatus.color} sx={{ alignSelf: 'flex-start' }} />
          {product.description && (
            <Typography sx={{ whiteSpace: 'pre-line' }} color="text.secondary">{product.description}</Typography>
          )}
          <Stack direction="row" spacing={1} alignItems="center">
            <IconButton sx={productActionButtonSx} aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>
              <Remove />
            </IconButton>
            <TextField
              label="Quantity"
              type="number"
              size="small"
              value={quantity}
              onChange={(event) => setQuantity(Math.max(1, Math.min(Math.floor(Number(event.target.value) || 1), Math.max(product.stock_quantity, 1))))}
              inputProps={{ min: 1, max: Math.max(product.stock_quantity, 1), step: 1 }}
              sx={{ width: 100 }}
            />
            <IconButton
              aria-label="Increase quantity"
              sx={productActionButtonSx}
              onClick={() => setQuantity((value) => Math.min(value + 1, Math.max(product.stock_quantity, 1)))}
              disabled={quantity >= product.stock_quantity}
            >
              <Add />
            </IconButton>
            <Button sx={productActionButtonSx} variant="contained" size="large" disabled={!product.in_stock || addMutation.isPending} onClick={addToCart}>
              {addMutation.isPending ? 'Adding…' : 'Add to Cart'}
            </Button>
          </Stack>
          {userQuery.isError && !axios.isAxiosError(userQuery.error) && (
            <Alert severity="warning">Could not verify your account. Add to Cart will ask you to sign in.</Alert>
          )}
        </Stack>
      </Box>

      <Paper variant="outlined" sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="h5" component="h2" fontWeight={700} gutterBottom>Customer reviews</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} sx={{ mb: 3 }}>
          <Box sx={{ minWidth: 180 }}>
            <Typography variant="h3" fontWeight={700}>{product.rating?.toFixed(1) ?? '—'}</Typography>
            <RatingStars rating={product.rating} count={product.reviews_count} />
          </Box>
          <Stack spacing={0.75} sx={{ width: { xs: '100%', sm: 320 } }}>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = product.rating_breakdown[String(rating) as keyof typeof product.rating_breakdown]
              const percentage = product.reviews_count ? (count / product.reviews_count) * 100 : 0
              return (
                <Stack key={rating} direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" sx={{ minWidth: 42 }}>{rating} star</Typography>
                  <LinearProgress variant="determinate" value={percentage} sx={{ flexGrow: 1, height: 8, borderRadius: 4 }} />
                  <Typography variant="caption" sx={{ minWidth: 24, textAlign: 'right' }}>{count}</Typography>
                </Stack>
              )
            })}
          </Stack>
        </Stack>
        {reviewsQuery.isError && <Alert severity="error">{getErrorMessage(reviewsQuery.error)}</Alert>}
        {reviewsQuery.isPending ? (
          <CircularProgress size={26} />
        ) : reviewsQuery.data?.data.length ? (
          <Stack spacing={2}>
            {reviewsQuery.data.data.map((review) => (
              <Box key={review.id}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap">
                  <Typography fontWeight={600}>{review.user.display_name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(review.date).toLocaleDateString()}
                  </Typography>
                </Stack>
                <RatingStars rating={review.rating} />
                {review.comment && <Typography sx={{ mt: 0.75 }}>{review.comment}</Typography>}
              </Box>
            ))}
            <Pagination
              page={reviewPage}
              count={reviewsQuery.data.meta.last_page}
              onChange={(_, page) => setReviewPage(page)}
              sx={{ alignSelf: 'center' }}
            />
          </Stack>
        ) : (
          <Typography color="text.secondary">No reviews yet.</Typography>
        )}
        {userQuery.data?.role === 'customer' && eligibilityQuery.isPending && (
          <CircularProgress size={22} sx={{ mt: 2 }} />
        )}
        {userQuery.data?.role === 'customer' && eligibilityQuery.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>Unable to check review eligibility.</Alert>
        )}
        {userQuery.data?.role === 'customer' && eligibilityQuery.data && (
          <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
            {eligibilityQuery.data.has_reviewed && !editingReview ? (
              <Stack spacing={1} alignItems="flex-start">
                <Typography fontWeight={700}>You reviewed this product</Typography>
                <Stack direction="row" spacing={1}>
                  <Button onClick={() => setEditingReview(true)}>Edit review</Button>
                  <Button color="error" onClick={() => setConfirmReviewDelete(true)}>Delete review</Button>
                </Stack>
              </Stack>
            ) : eligibilityQuery.data.can_review || editingReview ? (
              <Stack
                component="form"
                spacing={1.5}
                onSubmit={(event) => {
                  event.preventDefault()
                  reviewMutation.mutate()
                }}
                alignItems="flex-start"
              >
                <Typography variant="h6">{editingReview ? 'Edit your review' : 'Write a review'}</Typography>
                <Rating
                  value={reviewRating}
                  onChange={(_, value) => setReviewRating(value ?? 0)}
                  aria-label="Review rating"
                />
                {reviewErrors.rating && <FormHelperText error>{reviewErrors.rating}</FormHelperText>}
                <TextField
                  label="Comment (optional)"
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  error={Boolean(reviewErrors.comment)}
                  helperText={reviewErrors.comment ?? `${reviewComment.length}/1000`}
                  inputProps={{ maxLength: 1000 }}
                  multiline
                  minRows={3}
                  fullWidth
                  sx={{ maxWidth: 650 }}
                />
                <Stack direction="row" spacing={1}>
                  <Button type="submit" variant="contained" disabled={reviewRating < 1 || reviewMutation.isPending}>
                    {reviewMutation.isPending ? 'Saving…' : 'Submit review'}
                  </Button>
                  {editingReview && <Button onClick={() => setEditingReview(false)}>Cancel</Button>}
                </Stack>
              </Stack>
            ) : (
              <Typography color="text.secondary">
                Only customers who received this product can review it.
              </Typography>
            )}
          </Box>
        )}
        {!userQuery.data && !userQuery.isPending && (
          <Typography color="text.secondary" sx={{ mt: 3 }}>
            <Link component={RouterLink} to={`/login?returnUrl=${encodeURIComponent(location.pathname)}`} underline="hover">
              Log in
            </Link>
            {' '}to write a review.
          </Typography>
        )}
      </Paper>

      <ConfirmDialog
        open={confirmReviewDelete}
        title="Delete your review?"
        message="Your review and rating will be removed."
        busy={deleteReviewMutation.isPending}
        onCancel={() => setConfirmReviewDelete(false)}
        onConfirm={() => deleteReviewMutation.mutate()}
      />
      <Snackbar
        open={Boolean(cartMessage)}
        autoHideDuration={4000}
        onClose={() => setCartMessage('')}
        message={cartMessage}
      />
      <Snackbar
        open={Boolean(reviewMessage)}
        autoHideDuration={4000}
        onClose={() => setReviewMessage('')}
        message={reviewMessage}
      />
    </Stack>
  )
}

export default ProductDetailsPage
