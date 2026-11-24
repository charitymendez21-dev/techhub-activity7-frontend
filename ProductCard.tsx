import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Snackbar,
  Stack,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import type { ProductSummary } from '../../api/products'
import { cartApi } from '../../api/cart'
import { getErrorMessage } from '../../api/client'
import { cartQueryKey } from '../../hooks/useCart'
import { useAuthUser } from '../../hooks/useAuthUser'
import ProductImage from './ProductImage'
import productActionButtonSx from './productActionButtonSx'
import PriceTag from './PriceTag'
import RatingStars from './RatingStars'

type Props = {
  product: ProductSummary
}

function ProductCard({ product }: Props) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState('')
  const userQuery = useAuthUser()
  const addMutation = useMutation({
    mutationFn: () => cartApi.add(product.id, 1),
    onSuccess: (cart) => {
      queryClient.setQueryData(cartQueryKey, cart)
      setFeedback(`${product.name} added to your cart.`)
    },
    onError: (error) => setFeedback(getErrorMessage(error)),
  })
  const onSale = product.sale_price !== null

  function addToCart() {
    if (userQuery.data?.role !== 'customer') {
      const returnUrl = `/products/${product.slug}`
      navigate(`/login?returnUrl=${encodeURIComponent(returnUrl)}`)
      return
    }

    addMutation.mutate()
  }

  return (
    <>
      <Card
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'transform 180ms ease, box-shadow 180ms ease',
          '&:hover': {
            transform: 'translateY(-3px)',
            boxShadow: '0 0 0 1px rgba(25, 118, 210, 0.25), 0 0 22px rgba(25, 118, 210, 0.35)',
          },
          '@media (prefers-reduced-motion: reduce)': {
            transition: 'none',
            '&:hover': { transform: 'none' },
          },
        }}
      >
      <CardActionArea
        component={RouterLink}
        to={`/products/${product.slug}`}
        sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', flexGrow: 1 }}
      >
        <Box sx={{ width: '100%', height: 220 }}>
          <ProductImage src={product.image_url} alt={product.name} />
        </Box>
        <CardContent sx={{ width: '100%', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: 1 }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            {onSale && <Chip size="small" color="error" label="Sale" />}
            {!product.in_stock && <Chip size="small" label="Out of stock" />}
          </Stack>
          <Typography variant="h6" component="h2" fontSize="1rem" fontWeight={600}>
            {product.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {product.brand?.name ?? product.category.name}
          </Typography>
          <RatingStars rating={product.rating} count={product.reviews_count} />
          <PriceTag price={product.price} salePrice={product.sale_price} />
        </CardContent>
      </CardActionArea>
      <Button
        onClick={addToCart}
        disabled={!product.in_stock || addMutation.isPending || userQuery.data?.role === 'admin'}
        sx={[productActionButtonSx, { mx: 2, mb: 2 }]}
        variant="outlined"
      >
        {addMutation.isPending ? 'Adding…' : 'Add to cart'}
      </Button>
      </Card>
      <Snackbar
        open={Boolean(feedback)}
        autoHideDuration={3500}
        onClose={() => setFeedback('')}
        message={feedback}
      />
    </>
  )
}

export default ProductCard
