import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from '@mui/material'
import {
  CategoryOutlined,
  DashboardOutlined,
  Menu as MenuIcon,
  Inventory2Outlined,
  Logout,
  ReceiptLongOutlined,
  RateReviewOutlined,
  NotificationsOutlined,
  AssessmentOutlined,
  PeopleAltOutlined,
} from '@mui/icons-material'
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api, getCsrfCookie } from '../api/client'
import { SHOP_NAME } from '../config/shop'
import NotificationBell from '../components/NotificationBell'
import { authUserQueryKey, useAuthUser } from '../hooks/useAuthUser'

const drawerWidth = 250

function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const userQuery = useAuthUser()
  const returnPath = `${location.pathname}${location.search}`
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await getCsrfCookie()
      await api.post('/logout')
    },
    onSuccess: () => {
      queryClient.setQueryData(authUserQueryKey, null)
      navigate('/login')
    },
  })

  useEffect(() => {
    if (userQuery.data === null) {
      navigate('/login', { replace: true, state: { from: returnPath } })
    }
  }, [navigate, returnPath, userQuery.data])

  if (userQuery.isPending) {
    return <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
  }

  if (userQuery.isError) {
    return <Alert severity="error">Unable to load your account. Check the API connection.</Alert>
  }

  if (userQuery.data?.role !== 'admin') {
    return <Alert severity="error">You do not have permission to access the admin area.</Alert>
  }

  const navigation = [
    { label: 'Dashboard', to: '/admin', icon: <DashboardOutlined /> },
    { label: 'Categories', to: '/admin/categories', icon: <CategoryOutlined /> },
    { label: 'Products', to: '/admin/products', icon: <Inventory2Outlined /> },
    { label: 'Orders', to: '/admin/orders', icon: <ReceiptLongOutlined /> },
    { label: 'Reviews', to: '/admin/reviews', icon: <RateReviewOutlined /> },
    { label: 'Reports', to: '/admin/reports', icon: <AssessmentOutlined /> },
    { label: 'Users', to: '/admin/users', icon: <PeopleAltOutlined /> },
    { label: 'Notifications', to: '/admin/notifications', icon: <NotificationsOutlined /> },
  ]

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar>
        <Typography variant="h6" color="primary" fontWeight={700}>{SHOP_NAME} Admin</Typography>
      </Toolbar>
      <Divider />
      <List sx={{ px: 1.5, py: 2 }}>
        {navigation.map((item) => (
          <ListItemButton
            key={item.to}
            component={RouterLink}
            to={item.to}
            selected={location.pathname === item.to || (item.to !== '/admin' && location.pathname.startsWith(item.to))}
            onClick={() => setMobileOpen(false)}
            sx={{ borderRadius: 2, mb: 0.5 }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
      <Box sx={{ mt: 'auto', p: 2 }}>
        <Divider sx={{ mb: 1 }} />
        <Typography variant="body2" noWrap>{userQuery.data.name}</Typography>
        <Typography variant="caption" color="text.secondary" noWrap>{userQuery.data.email}</Typography>
        <Button
          startIcon={<Logout />}
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          sx={{ mt: 1 }}
          fullWidth
        >
          Sign out
        </Button>
        {logoutMutation.isError && <Alert severity="error" sx={{ mt: 1 }}>Sign out failed.</Alert>}
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{ width: { md: `calc(100% - ${drawerWidth}px)` }, ml: { md: `${drawerWidth}px` }, borderBottom: 1, borderColor: 'divider' }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 2, display: { md: 'none' } }}
            aria-label="Open navigation"
          >
            <MenuIcon />
          </IconButton>
          <Typography sx={{ flexGrow: 1 }} fontWeight={600}>Administration</Typography>
          <NotificationBell admin />
          <Avatar src={userQuery.data.avatar_url ?? undefined} sx={{ width: 34, height: 34, ml: 1 }}>
            {userQuery.data.first_name.slice(0, 1)}
          </Avatar>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: 'none', md: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, boxSizing: 'border-box' } }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box component="main" sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, md: 4 } }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}

export default AdminLayout
