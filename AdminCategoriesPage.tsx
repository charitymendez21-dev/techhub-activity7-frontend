import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  FormHelperText,
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
import { adminApi, getAdminError, getFieldErrors, type Category } from '../../api/admin'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'

type FormValues = {
  name: string
  description: string
  status: 'active' | 'inactive'
}

const emptyForm: FormValues = { name: '', description: '', status: 'active' }

function AdminCategoriesPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [status, setStatus] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<Category | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [values, setValues] = useState<FormValues>(emptyForm)
  const [image, setImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const params = useMemo(() => ({
    search: debouncedSearch || undefined,
    status: status || undefined,
    trashed: showDeleted ? 'with' : undefined,
    page: page + 1,
    per_page: 10,
  }), [debouncedSearch, page, showDeleted, status])
  const categoriesQuery = useQuery({
    queryKey: ['admin', 'categories', params],
    queryFn: () => adminApi.categories(params),
    placeholderData: keepPreviousData,
  })

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = new FormData()
      body.append('name', values.name)
      body.append('description', values.description)
      body.append('status', values.status)
      if (image) body.append('image', image)
      return editing
        ? adminApi.updateCategory(editing.id, body)
        : adminApi.createCategory(body)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      setDialogOpen(false)
      setFeedback({ message: editing ? 'Category updated.' : 'Category created.', severity: 'success' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (category: Category) => adminApi.deleteCategory(category.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      setDeleting(null)
      setFeedback({ message: 'Category moved to deleted items.', severity: 'success' })
    },
    onError: (error) => {
      setDeleting(null)
      setFeedback({ message: getAdminError(error), severity: 'error' })
    },
  })

  const restoreMutation = useMutation({
    mutationFn: (category: Category) => adminApi.restoreCategory(category.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] })
      setFeedback({ message: 'Category restored.', severity: 'success' })
    },
    onError: (error) => setFeedback({ message: getAdminError(error), severity: 'error' }),
  })

  useEffect(() => {
    if (!image) {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(image)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [image])

  function openCreate() {
    setEditing(null)
    setValues(emptyForm)
    setImage(null)
    setDialogOpen(true)
    saveMutation.reset()
  }

  function openEdit(category: Category) {
    setEditing(category)
    setValues({
      name: category.name,
      description: category.description ?? '',
      status: category.status,
    })
    setImage(null)
    setDialogOpen(true)
    saveMutation.reset()
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    saveMutation.mutate()
  }

  function selectImage(event: ChangeEvent<HTMLInputElement>) {
    setImage(event.target.files?.[0] ?? null)
  }

  const errors = getFieldErrors(saveMutation.error)
  const rows = categoriesQuery.data?.data ?? []

  return (
    <Stack spacing={2.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="space-between" alignItems={{ sm: 'center' }}>
        <Box>
          <Typography variant="h4" component="h1" fontWeight={700}>Categories</Typography>
          <Typography color="text.secondary">Create and organize your product categories.</Typography>
        </Box>
        <Button startIcon={<Add />} variant="contained" onClick={openCreate}>Add category</Button>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField
            label="Search categories"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setPage(0) }}
            size="small"
            sx={{ minWidth: { md: 280 }, flexGrow: 1 }}
          />
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel id="category-status-label">Status</InputLabel>
            <Select
              labelId="category-status-label"
              label="Status"
              value={status}
              onChange={(event) => { setStatus(event.target.value); setPage(0) }}
            >
              <MenuItem value="">All statuses</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Switch checked={showDeleted} onChange={(event) => { setShowDeleted(event.target.checked); setPage(0) }} />}
            label="Show deleted"
          />
        </Stack>
      </Paper>

      {categoriesQuery.isError && <Alert severity="error">{getAdminError(categoriesQuery.error)}</Alert>}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Products</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categoriesQuery.isPending ? (
                <TableRow><TableCell colSpan={4} align="center"><CircularProgress size={28} sx={{ my: 2 }} /></TableCell></TableRow>
              ) : rows.length === 0 ? (
                <TableRow><TableCell colSpan={4} align="center">No categories found.</TableCell></TableRow>
              ) : rows.map((category) => (
                <TableRow key={category.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Avatar variant="rounded" src={category.image_url ?? undefined} alt="" />
                      <Box>
                        <Typography fontWeight={600}>{category.name}</Typography>
                        <Typography variant="caption" color="text.secondary">{category.slug}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    {category.deleted_at
                      ? <Chip size="small" label="Deleted" color="default" />
                      : <Chip size="small" label={category.status} color={category.status === 'active' ? 'success' : 'default'} />}
                  </TableCell>
                  <TableCell align="right">{category.products_count}</TableCell>
                  <TableCell align="right">
                    {category.deleted_at ? (
                      <Tooltip title="Restore">
                        <IconButton
                          aria-label={`Restore ${category.name}`}
                          onClick={() => restoreMutation.mutate(category)}
                          disabled={restoreMutation.isPending}
                        >
                          <RestoreOutlined />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <>
                        <Tooltip title="Edit">
                          <IconButton aria-label={`Edit ${category.name}`} onClick={() => openEdit(category)}><EditOutlined /></IconButton>
                        </Tooltip>
                        <Tooltip title={category.products_count ? 'Reassign or remove products first' : 'Delete'}>
                          <span>
                            <IconButton
                              aria-label={`Delete ${category.name}`}
                              onClick={() => setDeleting(category)}
                              disabled={category.products_count > 0}
                            >
                              <DeleteOutline />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={categoriesQuery.data?.meta.total ?? 0}
          page={page}
          rowsPerPage={10}
          rowsPerPageOptions={[10]}
          onPageChange={(_, nextPage) => setPage(nextPage)}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => !saveMutation.isPending && setDialogOpen(false)} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={submit}>
          <DialogTitle>{editing ? 'Edit category' : 'Create category'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {saveMutation.isError && <Alert severity="error">{getAdminError(saveMutation.error)}</Alert>}
              <TextField
                label="Name"
                value={values.name}
                onChange={(event) => setValues({ ...values, name: event.target.value })}
                error={Boolean(errors.name)}
                helperText={errors.name}
                required
                autoFocus
              />
              <TextField
                label="Description"
                value={values.description}
                onChange={(event) => setValues({ ...values, description: event.target.value })}
                error={Boolean(errors.description)}
                helperText={errors.description}
                multiline
                minRows={3}
              />
              <FormControl error={Boolean(errors.status)}>
                <InputLabel id="category-form-status-label">Status</InputLabel>
                <Select
                  labelId="category-form-status-label"
                  label="Status"
                  value={values.status}
                  onChange={(event) => setValues({ ...values, status: event.target.value as FormValues['status'] })}
                >
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
                {errors.status && <FormHelperText>{errors.status}</FormHelperText>}
              </FormControl>
              <Button component="label" variant="outlined">
                Choose image
                <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={selectImage} />
              </Button>
              {(previewUrl || editing?.image_url) && (
                <Box component="img" src={previewUrl ?? editing?.image_url ?? ''} alt="Category preview" sx={{ width: 140, height: 100, objectFit: 'cover', borderRadius: 2 }} />
              )}
              {errors.image && <Typography color="error" variant="caption">{errors.image}</Typography>}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)} disabled={saveMutation.isPending}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving…' : 'Save category'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete category?"
        message={deleting?.products_count
          ? 'Categories with products cannot be deleted. Reassign or remove the products first.'
          : `Delete "${deleting?.name}"? It can be restored later.`}
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

export default AdminCategoriesPage
