import { useEffect, useState, type FormEvent, type MouseEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  AppBar,
  Avatar,
  Badge,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  Link,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import {
  CategoryOutlined,
  Menu as MenuIcon,
  Search,
  ShoppingCartOutlined,
} from '@mui/icons-material'
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api, getCsrfCookie } from '../api/client'
import { productApi } from '../api/products'
import { SHOP_NAME } from '../config/shop'
import { useCart } from '../hooks/useCart'
import { authUserQueryKey, useAuthUser } from '../hooks/useAuthUser'

const copyrightYear = new Date().getFullYear()
import NotificationBell from '../components/NotificationBell'
import type { AuthUser } from '../types'

function PublicLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [categoryAnchor, setCategoryAnchor] = useState<HTMLElement | null>(null)
  const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null)
  const categoriesQuery = useQuery({
    queryKey: ['catalog', 'categories'],
    queryFn: productApi.categories,
    staleTime: 5 * 60 * 1000,
  })
  const userQuery = useAuthUser()
  const cartQuery = useCart(userQuery.data?.role === 'customer')
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await getCsrfCookie()
      await api.post('/logout')
    },
    onSuccess: () => {
      queryClient.setQueryData<AuthUser | null>(authUserQueryKey, null)
      queryClient.removeQueries({ queryKey: ['cart'] })
      setAccountAnchor(null)
      navigate('/')
    },
  })

  useEffect(() => {
    setSearch(new URLSearchParams(location.search).get('search') ?? '')
  }, [location.search])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = search.trim()
    navigate(query ? `/products?search=${encodeURIComponent(query)}` : '/products')
    setMobileOpen(false)
  }

  function openMenu(event: MouseEvent<HTMLElement>, menu: 'categories' | 'account') {
    if (menu === 'categories') setCategoryAnchor(event.currentTarget)
    else setAccountAnchor(event.currentTarget)
  }

  const categoryLinks = (categoriesQuery.data ?? []).map((category) => (
    <MenuItem
      component={RouterLink}
      to={`/products?category=${encodeURIComponent(category.slug)}`}
      key={category.id}
      onClick={() => {
        setCategoryAnchor(null)
        setMobileOpen(false)
      }}
    >
      {category.name}
    </MenuItem>
  ))

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="sticky" color="inherit" elevation={1}>
        <Toolbar sx={{ gap: { xs: 1, md: 2 } }}>
          <IconButton
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
            sx={{ display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            component={RouterLink}
            to="/"
            sx={{ textDecoration: 'none', whiteSpace: 'nowrap', color: 'text.primary' }}
          >
            <Box
              component="img"
              src="/techhub-logo.png"
              alt="TECHHUB"
              sx={{ width: { xs: 38, md: 44 }, height: { xs: 38, md: 44 }, objectFit: 'contain' }}
            />
            <Typography variant="h6" fontWeight={900} letterSpacing="-.02em">
              {SHOP_NAME}
            </Typography>
          </Stack>
          <Button
            color="inherit"
            startIcon={<CategoryOutlined />}
            onClick={(event) => openMenu(event, 'categories')}
            sx={{ display: { xs: 'none', md: 'inline-flex' }, whiteSpace: 'nowrap' }}
          >
            Categories
          </Button>
          <Menu
            anchorEl={categoryAnchor}
            open={Boolean(categoryAnchor)}
            onClose={() => setCategoryAnchor(null)}
          >
            {categoryLinks.length > 0 ? categoryLinks : <MenuItem disabled>No categories</MenuItem>}
          </Menu>
          <Box component="form" onSubmit={submitSearch} sx={{ display: 'flex', flexGrow: 1, maxWidth: 700, ml: { md: 1 } }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search products"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              inputProps={{ 'aria-label': 'Search products' }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: 'rgba(6, 18, 33, .92)',
                  '& fieldset': { borderColor: 'rgba(125, 211, 252, .18)' },
                  '&:hover fieldset': { borderColor: 'rgba(56, 189, 248, .55)' },
                },
              }}
            />
            <IconButton type="submit" color="primary" aria-label="Submit search">
              <Search />
            </IconButton>
          </Box>
          <IconButton
            component={RouterLink}
            to="/cart"
            aria-label={`Shopping cart (${cartQuery.data?.item_count ?? 0} items)`}
            color="inherit"
          >
            <Badge badgeContent={cartQuery.data?.item_count ?? 0} color="primary">
              <ShoppingCartOutlined />
            </Badge>
          </IconButton>
          {userQuery.data ? (
            <>
              <NotificationBell admin={userQuery.data.role === 'admin'} />
              <Button
                color="inherit"
                startIcon={(
                  <Avatar src={userQuery.data.avatar_url ?? undefined} sx={{ width: 30, height: 30 }}>
                    {userQuery.data.first_name.slice(0, 1)}
                  </Avatar>
                )}
                onClick={(event) => openMenu(event, 'account')}
                sx={{ display: { xs: 'none', sm: 'inline-flex' }, maxWidth: 170 }}
              >
                <Typography noWrap>{userQuery.data.name}</Typography>
              </Button>
              <IconButton
                aria-label="Account menu"
                onClick={(event) => openMenu(event, 'account')}
                sx={{ display: { xs: 'inline-flex', sm: 'none' } }}
              >
                <Avatar src={userQuery.data.avatar_url ?? undefined} sx={{ width: 30, height: 30 }}>
                  {userQuery.data.first_name.slice(0, 1)}
                </Avatar>
              </IconButton>
              <Menu
                anchorEl={accountAnchor}
                open={Boolean(accountAnchor)}
                onClose={() => setAccountAnchor(null)}
              >
                {userQuery.data.role === 'admin' && (
                  <MenuItem component={RouterLink} to="/admin" onClick={() => setAccountAnchor(null)}>
                    Admin
                  </MenuItem>
                )}
                {userQuery.data.role === 'customer' && (
                  <MenuItem component={RouterLink} to="/orders" onClick={() => setAccountAnchor(null)}>
                    My Orders
                  </MenuItem>
                )}
                {userQuery.data.role === 'customer' && (
                  <MenuItem component={RouterLink} to="/profile" onClick={() => setAccountAnchor(null)}>
                    Profile
                  </MenuItem>
                )}
                <MenuItem
                  component={RouterLink}
                  to={userQuery.data.role === 'admin' ? '/admin/notifications' : '/notifications'}
                  onClick={() => setAccountAnchor(null)}
                >
                  Notifications
                </MenuItem>
                <MenuItem onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
                  {logoutMutation.isPending ? 'Signing out…' : 'Sign out'}
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button component={RouterLink} to="/login" size="small">Sign in</Button>
              <Button
                component={RouterLink}
                to="/register"
                variant="contained"
                size="small"
                sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
              >
                Register
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      <Drawer open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 280, p: 2 }}>
          <Stack spacing={1}>
            <Typography variant="h6" fontWeight={700}>Browse</Typography>
            <Button component={RouterLink} to="/products" onClick={() => setMobileOpen(false)} sx={{ justifyContent: 'flex-start' }}>
              All products
            </Button>
            {categoriesQuery.data?.map((category) => (
              <Button
                component={RouterLink}
                to={`/products?category=${encodeURIComponent(category.slug)}`}
                key={category.id}
                onClick={() => setMobileOpen(false)}
                sx={{ justifyContent: 'flex-start' }}
              >
                {category.name}
              </Button>
            ))}
            <Divider />
            {userQuery.data ? (
              <>
                {userQuery.data.role === 'customer' && (
                  <Button component={RouterLink} to="/orders" onClick={() => setMobileOpen(false)}>My Orders</Button>
                )}
                {userQuery.data.role === 'customer' && (
                  <Button component={RouterLink} to="/profile" onClick={() => setMobileOpen(false)}>Profile</Button>
                )}
                <Button
                  component={RouterLink}
                  to={userQuery.data.role === 'admin' ? '/admin/notifications' : '/notifications'}
                  onClick={() => setMobileOpen(false)}
                >
                  Notifications
                </Button>
                <Button onClick={() => logoutMutation.mutate()} disabled={logoutMutation.isPending}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Button component={RouterLink} to="/login" onClick={() => setMobileOpen(false)}>Sign in</Button>
                <Button component={RouterLink} to="/register" onClick={() => setMobileOpen(false)}>Register</Button>
              </>
            )}
          </Stack>
        </Box>
      </Drawer>

      {logoutMutation.isError && (
        <Container sx={{ pt: 2 }}>
          <Alert severity="error">Unable to sign out. Please try again.</Alert>
        </Container>
      )}

      <Container maxWidth="xl" sx={{ flexGrow: 1, py: { xs: 2.5, md: 4 } }}>
        <Outlet />
      </Container>

      <Box component="footer" sx={{ bgcolor: '#091525', borderTop: '1px solid rgba(125,211,252,.12)', py: 3, mt: 5 }}>
        <Container maxWidth="xl">
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between">
            <Typography variant="body2" color="text.secondary">
              © {copyrightYear} {SHOP_NAME}
            </Typography>
            <Link component={RouterLink} to="/products" underline="hover" variant="body2">
              Browse catalog
            </Link>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}

export default PublicLayout
