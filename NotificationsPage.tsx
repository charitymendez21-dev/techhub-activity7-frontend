import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Paper,
  Switch,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { notificationsApi } from '../api/notifications'

type Props = { admin?: boolean }

function NotificationsPage({ admin = false }: Props) {
  const [unreadOnly, setUnreadOnly] = useState(false)
  const [page, setPage] = useState(1)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['notifications', 'page', { unreadOnly, page }],
    queryFn: () => notificationsApi.list({ unread: unreadOnly ? 1 : undefined, page, per_page: 15 }),
  })
  const markRead = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const remove = useMutation({
    mutationFn: notificationsApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const notifications = query.data?.data ?? []

  function openNotification(id: string, link: string, readAt: string | null) {
    const path = link.startsWith('/') && !link.startsWith('//') ? link : '/'
    if (readAt) {
      navigate(path)
      return
    }
    markRead.mutate(id, { onSuccess: () => navigate(path) })
  }

  return (
    <Box maxWidth={900} sx={{ mx: 'auto' }}>
      <Typography variant="h4" component="h1" fontWeight={700} gutterBottom>
        {admin ? 'Admin notifications' : 'Notifications'}
      </Typography>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <FormControlLabel
          control={<Switch checked={unreadOnly} onChange={(event) => { setUnreadOnly(event.target.checked); setPage(1) }} />}
          label="Unread only"
        />
        {query.isError && <Alert severity="error">Unable to load notifications.</Alert>}
        {query.isPending ? (
          <Box sx={{ display: 'grid', placeItems: 'center', p: 4 }}><CircularProgress /></Box>
        ) : notifications.length ? (
          <>
            <List>
              {notifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  divider
                  secondaryAction={(
                    <Button color="error" onClick={() => remove.mutate(notification.id)} disabled={remove.isPending}>
                      Delete
                    </Button>
                  )}
                  sx={{ bgcolor: notification.read_at ? 'transparent' : 'action.hover', pr: 12 }}
                >
                  <ListItemText
                    primary={(
                      <Button
                        component={RouterLink}
                        to={notification.link}
                        onClick={(event) => {
                          event.preventDefault()
                          openNotification(notification.id, notification.link, notification.read_at)
                        }}
                        sx={{ p: 0, textAlign: 'left', textTransform: 'none', fontWeight: notification.read_at ? 400 : 700 }}
                      >
                        {notification.title}
                      </Button>
                    )}
                    secondary={`${notification.message} · ${new Date(notification.created_at).toLocaleString()}`}
                  />
                </ListItem>
              ))}
            </List>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1}>Previous</Button>
              <Typography variant="body2">Page {query.data?.meta.current_page} of {query.data?.meta.last_page}</Typography>
              <Button onClick={() => setPage((value) => value + 1)} disabled={page >= (query.data?.meta.last_page ?? 1)}>Next</Button>
            </Box>
          </>
        ) : (
          <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>No notifications to show.</Typography>
        )}
      </Paper>
      {(markRead.isError || remove.isError) && <Alert severity="error" sx={{ mt: 2 }}>Unable to update this notification.</Alert>}
    </Box>
  )
}

export default NotificationsPage
