import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Badge,
  Box,
  Button,
  CircularProgress,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Popover,
  Stack,
  Typography,
} from '@mui/material'
import { NotificationsNone } from '@mui/icons-material'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import { notificationsApi, type ShopNotification } from '../api/notifications'

type Props = { admin?: boolean }

function NotificationBell({ admin = false }: Props) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const countQuery = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 45_000,
    refetchIntervalInBackground: false,
  })
  const listQuery = useQuery({
    queryKey: ['notifications', 'list', 8],
    queryFn: () => notificationsApi.list({ per_page: 8 }),
    enabled: Boolean(anchor),
  })
  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const markAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
  const notifications = listQuery.data?.data ?? []
  const listPath = admin ? '/admin/notifications' : '/notifications'

  function follow(notification: ShopNotification) {
    const path = notification.link.startsWith('/') && !notification.link.startsWith('//')
      ? notification.link
      : '/'
    if (notification.read_at) {
      setAnchor(null)
      navigate(path)
      return
    }
    markReadMutation.mutate(notification.id, {
      onSuccess: () => {
        setAnchor(null)
        navigate(path)
      },
    })
  }

  return (
    <>
      <IconButton
        color="inherit"
        aria-label={`Notifications (${countQuery.data ?? 0} unread)`}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        <Badge badgeContent={countQuery.data ?? 0} color="error">
          <NotificationsNone />
        </Badge>
      </IconButton>
      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Box sx={{ width: { xs: 320, sm: 390 }, maxWidth: '90vw', p: 2 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Notifications</Typography>
            <Button
              size="small"
              onClick={() => markAllMutation.mutate()}
              disabled={!countQuery.data || markAllMutation.isPending}
            >
              Mark all read
            </Button>
          </Stack>
          {markReadMutation.isError || markAllMutation.isError ? (
            <Alert severity="error" sx={{ mt: 1 }}>Unable to update notifications.</Alert>
          ) : null}
          {listQuery.isPending ? (
            <Box sx={{ display: 'grid', placeItems: 'center', p: 3 }}><CircularProgress size={24} /></Box>
          ) : notifications.length ? (
            <List disablePadding>
              {notifications.map((notification) => (
                <ListItemButton
                  key={notification.id}
                  onClick={() => follow(notification)}
                  disabled={markReadMutation.isPending}
                  sx={{ bgcolor: notification.read_at ? 'transparent' : 'action.hover', borderRadius: 1 }}
                >
                  <ListItemText
                    primary={notification.title}
                    secondary={`${notification.message} · ${new Date(notification.created_at).toLocaleString()}`}
                    primaryTypographyProps={{ fontWeight: notification.read_at ? 400 : 700 }}
                  />
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
              You are all caught up.
            </Typography>
          )}
          <Button component={RouterLink} to={listPath} onClick={() => setAnchor(null)} fullWidth>
            View all notifications
          </Button>
        </Box>
      </Popover>
    </>
  )
}

export default NotificationBell
