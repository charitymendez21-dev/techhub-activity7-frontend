import { Rating, Stack, Typography } from '@mui/material'

type Props = {
  rating: number | null
  count?: number
  size?: 'small' | 'medium' | 'large'
}

function RatingStars({ rating, count, size = 'small' }: Props) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Rating value={rating ?? 0} precision={0.5} readOnly size={size} />
      {rating !== null ? (
        <Typography variant="body2" color="text.secondary">
          {rating.toFixed(1)}{count !== undefined ? ` (${count})` : ''}
        </Typography>
      ) : (
        <Typography variant="body2" color="text.secondary">No reviews</Typography>
      )}
    </Stack>
  )
}

export default RatingStars
