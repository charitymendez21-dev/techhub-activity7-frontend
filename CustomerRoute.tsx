import { Box, CircularProgress } from '@mui/material'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthUser } from '../hooks/useAuthUser'

function CustomerRoute() {
  const location = useLocation()
  const userQuery = useAuthUser()

  if (userQuery.isPending) {
    return <Box sx={{ minHeight: 300, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
  }

  if (userQuery.data?.role === 'admin') {
    return <Navigate to="/products" replace />
  }

  if (userQuery.data?.role !== 'customer') {
    const returnUrl = `${location.pathname}${location.search}`
    return <Navigate to={`/login?returnUrl=${encodeURIComponent(returnUrl)}`} replace />
  }

  return <Outlet />
}

export default CustomerRoute
