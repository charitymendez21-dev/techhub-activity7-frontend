import { useMemo, useState, type FormEvent } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Avatar,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
  TablePagination,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material'
import { Add, DeleteOutline, EditOutlined, RestoreOutlined } from '@mui/icons-material'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { getErrorMessage } from '../../api/client'
import { usersApi, type AdminUser } from '../../api/users'
import ConfirmDialog from '../../components/ConfirmDialog'

type UserForm = {
  name: string
  email: string
  role: 'customer' | 'admin'
  is_active: boolean
  password: string
  password_confirmation: string
}

type PendingAction =
  | { kind: 'active'; user: AdminUser; active: boolean }
  | { kind: 'delete'; user: AdminUser }

const blankForm: UserForm = {
  name: '', email: '', role: 'customer', is_active: true, password: '', password_confirmation: '',
}

function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search)
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [page, setPage] = useState(0)
  const [editing, setEditing] = useState<AdminUser | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<UserForm>(blankForm)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [feedback, setFeedback] = useState<{ message: string; severity: 'success' | 'error' } | null>(null)

  const params = useMemo(() => ({
    search: debouncedSearch || undefined,
    role: role || undefined,
    status: status || undefined,
    trashed: showDeleted ? 'with' : undefined,
    page: page + 1,
    per_page: 10,
  }), [debouncedSearch, page, role, showDeleted, status])
  const usersQuery = useQuery({
    queryKey: ['admin', 'users', params],
    queryFn: () => usersApi.list(params),
    placeholderData: keepPreviousData,
  })

  const refreshUsers = () => queryClient.invalidateQueries({ queryKey: ['admin', 'users'] })
  const saveMutation = useMutation({
    mutationFn: () => {
      const body: Record<string, unknown> = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role,
        is_active: form.is_active,
      }
      if (form.password) {
        body.password = form.password
        body.password_confirmation = form.password_confirmation
      }
      return editing ? usersApi.update(editing.id, body) : usersApi.create(body)
    },
    onSuccess: () => {
      setFormOpen(false)
      setFeedback({ message: editing ? 'User updated.' : 'User created.', severity: 'success' })
      void refreshUsers()
    },
    onError: (error) => setFeedback({ message: getErrorMessage(error), severity: 'error' }),
  })
  const activeMutation = useMutation({
    mutationFn: ({ user, active }: Extract<PendingAction, { kind: 'active' }>) => user.role === 'customer'
      ? usersApi.toggleActive(user.id, active)
      : usersApi.update(user.id, { name: user.name, email: user.email, role: user.role, is_active: active }),
    onSuccess: (_, action) => {
      setPendingAction(null)
      setFeedback({ message: action.active ? 'Account unblocked.' : 'Account blocked.', severity: 'success' })
      void refreshUsers()
    },
    onError: (error) => {
      setPendingAction(null)
      setFeedback({ message: getErrorMessage(error), severity: 'error' })
    },
  })
  const deleteMutation = useMutation({
    mutationFn: (user: AdminUser) => usersApi.remove(user.id),
    onSuccess: () => {
      setPendingAction(null)
      setFeedback({ message: 'User moved to deleted items.', severity: 'success' })
      void refreshUsers()
    },
    onError: (error) => {
      setPendingAction(null)
      setFeedback({ message: getErrorMessage(error), severity: 'error' })
    },
  })
  const restoreMutation = useMutation({
    mutationFn: (user: AdminUser) => usersApi.restore(user.id),
    onSuccess: () => {
      setFeedback({ message: 'User restored.', severity: 'success' })
      void refreshUsers()
    },
    onError: (error) => setFeedback({ message: getErrorMessage(error), severity: 'error' }),
  })

  const openCreate = () => {
    setEditing(null)
    setForm(blankForm)
    setFormOpen(true)
  }
  const openEdit = (user: AdminUser) => {
    setEditing(user)
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      password: '',
      password_confirmation: '',
    })
    setFormOpen(true)
  }
  const submitForm = (event: FormEvent) => {
    event.preventDefault()
    saveMutation.mutate()
  }
  const confirmPending = () => {
    if (pendingAction?.kind === 'active') activeMutation.mutate(pendingAction)
    if (pendingAction?.kind === 'delete') deleteMutation.mutate(pendingAction.user)
  }

  return (
    <Stack spacing={2}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <Typography variant="h4" component="h1" fontWeight={700} sx={{ flexGrow: 1 }}>Users</Typography>
        <Button variant="outlined" onClick={() => { setShowDeleted(!showDeleted); setPage(0) }}>
          {showDeleted ? 'Hide deleted' : 'Show deleted'}
        </Button>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Add user</Button>
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
        <TextField size="small" label="Search name or email" value={search} onChange={(event) => { setSearch(event.target.value); setPage(0) }} />
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="user-role-filter">Role</InputLabel>
          <Select labelId="user-role-filter" label="Role" value={role} onChange={(event) => { setRole(event.target.value); setPage(0) }}>
            <MenuItem value="">All roles</MenuItem><MenuItem value="customer">Customer</MenuItem><MenuItem value="admin">Admin</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel id="user-status-filter">Status</InputLabel>
          <Select labelId="user-status-filter" label="Status" value={status} onChange={(event) => { setStatus(event.target.value); setPage(0) }}>
            <MenuItem value="">All statuses</MenuItem><MenuItem value="active">Active</MenuItem><MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      {usersQuery.isError && <Alert severity="error">Unable to load users.</Alert>}
      <Paper variant="outlined">
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow>
              <TableCell>User</TableCell><TableCell>Email</TableCell><TableCell>Role</TableCell>
              <TableCell>Active</TableCell><TableCell align="right">Orders</TableCell>
              <TableCell>Joined</TableCell><TableCell align="right">Actions</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {usersQuery.data?.data.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Avatar src={user.avatar_url ?? undefined} sx={{ width: 34, height: 34 }}>{user.name.slice(0, 1)}</Avatar>
                      <Typography variant="body2" fontWeight={600}>{user.name}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell><Chip size="small" label={user.role} color={user.role === 'admin' ? 'primary' : 'default'} /></TableCell>
                  <TableCell>
                    {user.deleted_at
                      ? <Chip size="small" label="Deleted" color="default" />
                      : <Switch
                        size="small"
                        checked={user.is_active}
                        inputProps={{ 'aria-label': `Set ${user.name} active` }}
                        onChange={(_, active) => setPendingAction({ kind: 'active', user, active })}
                      />}
                  </TableCell>
                  <TableCell align="right">{user.orders_count}</TableCell>
                  <TableCell>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</TableCell>
                  <TableCell align="right">
                    {user.deleted_at
                      ? <Tooltip title="Restore"><IconButton aria-label={`Restore ${user.name}`} onClick={() => restoreMutation.mutate(user)}><RestoreOutlined /></IconButton></Tooltip>
                      : <>
                        <Tooltip title="Edit"><IconButton aria-label={`Edit ${user.name}`} onClick={() => openEdit(user)}><EditOutlined /></IconButton></Tooltip>
                        <Tooltip title="Delete"><IconButton aria-label={`Delete ${user.name}`} color="error" onClick={() => setPendingAction({ kind: 'delete', user })}><DeleteOutline /></IconButton></Tooltip>
                      </>}
                  </TableCell>
                </TableRow>
              ))}
              {usersQuery.data?.data.length === 0 && <TableRow><TableCell colSpan={7} align="center">No users found.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={usersQuery.data?.meta.total ?? 0}
          page={page}
          rowsPerPage={10}
          onPageChange={(_, nextPage) => setPage(nextPage)}
          rowsPerPageOptions={[10]}
        />
      </Paper>
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} fullWidth maxWidth="sm">
        <form onSubmit={submitForm}>
          <DialogTitle>{editing ? 'Edit user' : 'Create user'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField required label="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
              <TextField required type="email" label="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              <FormControl>
                <InputLabel id="user-edit-role">Role</InputLabel>
                <Select labelId="user-edit-role" label="Role" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value as UserForm['role'] })}>
                  <MenuItem value="customer">Customer</MenuItem><MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
              <FormControlLabel control={<Switch checked={form.is_active} onChange={(_, is_active) => setForm({ ...form, is_active })} />} label="Active" />
              <TextField
                label={editing ? 'New password (optional)' : 'Password'}
                type="password"
                required={!editing}
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
              />
              <TextField
                label="Confirm password"
                type="password"
                required={Boolean(form.password) || !editing}
                value={form.password_confirmation}
                onChange={(event) => setForm({ ...form, password_confirmation: event.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : 'Save'}</Button>
          </DialogActions>
        </form>
      </Dialog>
      <ConfirmDialog
        open={pendingAction !== null}
        title={pendingAction?.kind === 'delete' ? 'Delete user?' : pendingAction?.active ? 'Unblock customer?' : 'Block customer?'}
        message={pendingAction?.kind === 'delete'
          ? `Move ${pendingAction.user.name} to deleted users?`
          : pendingAction?.kind === 'active'
            ? `${pendingAction.active ? 'Allow' : 'Prevent'} ${pendingAction.user.name} from signing in?`
            : ''}
        confirmLabel={pendingAction?.kind === 'delete' ? 'Delete' : pendingAction?.active ? 'Unblock' : 'Block'}
        busy={deleteMutation.isPending || activeMutation.isPending}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmPending}
      />
      <Snackbar open={Boolean(feedback)} autoHideDuration={6000} onClose={() => setFeedback(null)}>
        <Alert severity={feedback?.severity ?? 'info'} onClose={() => setFeedback(null)}>{feedback?.message}</Alert>
      </Snackbar>
    </Stack>
  )
}

export default AdminUsersPage
