import { Stack, Typography } from '@mui/material'
import { priceFormatter } from '../../config/store'

type Props = {
  price: string | number
  salePrice?: string | number | null
  size?: 'body1' | 'h6' | 'h5'
}

function PriceTag({ price, salePrice, size = 'body1' }: Props) {
  const onSale = salePrice !== null && salePrice !== undefined && Number(salePrice) < Number(price)

  return (
    <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap">
      <Typography variant={size} fontWeight={700} color={onSale ? 'error.main' : 'text.primary'}>
        {priceFormatter.format(Number(onSale ? salePrice : price))}
      </Typography>
      {onSale && (
        <Typography variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through' }}>
          {priceFormatter.format(Number(price))}
        </Typography>
      )}
    </Stack>
  )
}

export default PriceTag
