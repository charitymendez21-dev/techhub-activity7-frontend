import { useMemo, useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Rating,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import { DeleteOutline } from '@mui/icons-material'
import { reviewsApi, type AdminReview } from '../../api/reviews'
import { getAdminError } from '../../api/admin'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'

function AdminReviewsPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [rating, setRating] = useState('')
  const [product, setProduct] = useState('')
  const [page, setPage] = useState(0)
  const [deleting, setDeleting] = useState<AdminReview | null>(null)
  const [feedback, setFeedback] = useState('')
  const params = useMemo(() => ({
    search: debouncedSearch || undefined,
    rating: rating || undefined,
    product: product || undefined,
    page: page + 1,
    per_page: 10,
  }), [debouncedSearch, page, product, rating])
  const query = useQuery({
    queryKey: ['admin', 'reviews', params],
    queryFn: () => reviewsApi.adminList(params),
    placeholderData: keepPreviousData,
  })
  const deleteMutation = useMutation({
    mutationFn: (review: AdminReview) => reviewsApi.adminRemove(review.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'reviews'] })
      queryClient.invalidateQueries({ queryKey: ['catalog', 'product'] })
      setDeleting(null)
      setFeedback('Review deleted.')
    },
    onError: (error) => {
      setDeleting(null)
      setFeedback(getAdminError(error))
    },
  })

  function changeSearch(value: string) {
    setSearch(value)
    setPage(0)
  }

  const rows = query.data?.data ?? []

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography variant="h4" component="h1" fontWeight={700}>Reviews</Typography>
        <Typography color="text.secondary">Review moderation and customer feedback.</Typography>
      </Box>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField label="Search comment or customer" value={search} onChange={(event) => changeSearch(event.target.value)} fullWidth />
        <TextField select label="Rating" value={rating} onChange={(event) => { setRating(event.target.value); setPage(0) }} sx={{ minWidth: 150 }}>
          <MenuItem value="">All ratings</MenuItem>
          {[5, 4, 3, 2, 1].map((value) => <MenuItem key={value} value={value}>{value} stars</MenuItem>)}
        </TextField>
        <TextField label="Product ID" type="number" value={product} onChange={(event) => { setProduct(event.target.value); setPage(0) }} sx={{ minWidth: 160 }} />
      </Stack>
      {query.isError && <Alert severity="error">{getAdminError(query.error)}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Rating</TableCell>
              <TableCell>Comment</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {query.isPending ? (
              <TableRow><TableCell colSpan={6} align="center"><CircularProgress size={28} /></TableCell></TableRow>
            ) : rows.length ? rows.map((review) => (
              <TableRow key={review.id} hover>
                <TableCell>{review.product?.name ?? 'Deleted product'}</TableCell>
                <TableCell>{review.user.display_name}</TableCell>
                <TableCell><Rating value={review.rating} readOnly size="small" /></TableCell>
                <TableCell sx={{ maxWidth: 320, whiteSpace: 'normal' }}>{review.comment || '—'}</TableCell>
                <TableCell>{new Date(review.date).toLocaleDateString()}</TableCell>
                <TableCell align="right">
                  <Button color="error" startIcon={<DeleteOutline />} onClick={() => setDeleting(review)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow><TableCell colSpan={6} align="center">No reviews found.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          component="div"
          count={query.data?.meta.total ?? 0}
          page={page}
          onPageChange={(_, value) => setPage(value)}
          rowsPerPage={10}
          onRowsPerPageChange={() => undefined}
          rowsPerPageOptions={[10]}
        />
      </TableContainer>
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete review?"
        message="This review will be permanently removed and the product rating will be recalculated."
        busy={deleteMutation.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() => deleting && deleteMutation.mutate(deleting)}
      />
      <Snackbar open={Boolean(feedback)} autoHideDuration={4000} onClose={() => setFeedback('')} message={feedback} />
    </Stack>
  )
}

export default AdminReviewsPage
