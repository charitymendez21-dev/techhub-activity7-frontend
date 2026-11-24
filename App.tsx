import { lazy, Suspense, Component, useEffect, type ReactNode } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Box, CircularProgress, Button, Typography } from '@mui/material'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
const AdminLayout = lazy(() => import('./layouts/AdminLayout'))
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'))
const AdminCategoriesPage = lazy(() => import('./pages/admin/AdminCategoriesPage'))
const AdminProductsPage = lazy(() => import('./pages/admin/AdminProductsPage'))
const ProductFormPage = lazy(() => import('./pages/admin/ProductFormPage'))
import PublicLayout from './layouts/PublicLayout'
import HomePage from './pages/HomePage'
import ProductsPage from './pages/ProductsPage'
import ProductDetailsPage from './pages/ProductDetailsPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage'
import CustomerRoute from './components/CustomerRoute'
import OrdersPage from './pages/OrdersPage'
import OrderDetailPage from './pages/OrderDetailPage'
const AdminOrdersPage = lazy(() => import('./pages/admin/AdminOrdersPage'))
const AdminOrderDetailPage = lazy(() => import('./pages/admin/AdminOrderDetailPage'))
import ProfilePage from './pages/ProfilePage'
import NotificationsPage from './pages/NotificationsPage'
const AdminReviewsPage = lazy(() => import('./pages/admin/AdminReviewsPage'))
const AdminReportsPage = lazy(() => import('./pages/admin/AdminReportsPage'))
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'))

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center', textAlign: 'center', p: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Something went wrong</Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 2 }}>Please refresh the page and try again.</Typography>
            <Button variant="contained" onClick={() => window.location.reload()}>Refresh</Button>
          </Box>
        </Box>
      )
    }
    return this.props.children
  }
}

function SuspenseFallback() {
  return <Box sx={{ minHeight: '40vh', display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
}

function NotFoundPage() {
  return (
    <Box sx={{ minHeight: '60vh', display: 'grid', placeItems: 'center', textAlign: 'center' }}>
      <Box>
        <Typography variant="h3" fontWeight={800}>404</Typography>
        <Typography variant="h6" sx={{ mt: 1 }}>Page not found</Typography>
        <Button href="/products" variant="contained" sx={{ mt: 2 }}>Browse products</Button>
      </Box>
    </Box>
  )
}

function PageTitle() {
  const location = useLocation()
  useEffect(() => {
    const labels: Record<string, string> = {
      '/': 'Home',
      '/products': 'Products',
      '/cart': 'Cart',
      '/checkout': 'Checkout',
      '/orders': 'Orders',
      '/profile': 'Profile',
      '/notifications': 'Notifications',
      '/login': 'Sign in',
      '/register': 'Create account',
      '/forgot-password': 'Forgot password',
      '/reset-password': 'Reset password',
      '/admin': 'Admin dashboard',
    }
    const exactLabel = labels[location.pathname]
    const label = exactLabel
      ?? (location.pathname.startsWith('/admin/') ? 'Admin' : 'TECHHUB')
    document.title = `${label} | TECHHUB`
  }, [location.pathname])
  return null
}

function App() {
  return (
    <ErrorBoundary>
    <PageTitle />
    <Suspense fallback={<SuspenseFallback />}>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/:slug" element={<ProductDetailsPage />} />
        <Route element={<CustomerRoute />}>
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="orders/:orderId/confirmation" element={<OrderConfirmationPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:orderId" element={<OrderDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
      </Route>
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="categories" element={<AdminCategoriesPage />} />
        <Route path="products" element={<AdminProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:productId/edit" element={<ProductFormPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:orderId" element={<AdminOrderDetailPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="users" element={<AdminUsersPage />} />
        <Route path="notifications" element={<NotificationsPage admin />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </Suspense>
    </ErrorBoundary>
  )
}

export default App
