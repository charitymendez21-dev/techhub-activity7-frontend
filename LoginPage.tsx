import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Checkbox,
  Container,
  FormControlLabel,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom'
import { api, getCsrfCookie, getErrorMessage } from '../api/client'
import { authUserQueryKey } from '../hooks/useAuthUser'
import type { ApiResource, AuthUser } from '../types'
import { getPostLoginUrl } from '../utils/navigation'

function LoginPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const loginMutation = useMutation({
    mutationFn: async () => {
      await getCsrfCookie()
      const response = await api.post<ApiResource<AuthUser>>('/login', {
        email,
        password,
        remember,
      })
      return response.data.data
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authUserQueryKey, user)
      const stateReturnUrl = (location.state as { from?: unknown } | null)?.from
      const returnUrl = new URLSearchParams(location.search).get('returnUrl')
        ?? (typeof stateReturnUrl === 'string' ? stateReturnUrl : null)
      navigate(getPostLoginUrl(returnUrl, user.role), { replace: true })
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    loginMutation.mutate()
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper component="form" onSubmit={handleSubmit} elevation={2} sx={{ p: { xs: 3, sm: 5 } }}>
        <Stack spacing={2.5}>
          <Typography variant="h4" component="h1">
            Sign in
          </Typography>
          <Typography color="text.secondary">
            Use your account email and password.
          </Typography>
          {loginMutation.isError && (
            <Alert severity="error">{getErrorMessage(loginMutation.error)}</Alert>
          )}
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            fullWidth
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            fullWidth
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={remember}
                onChange={(event) => setRemember(event.target.checked)}
              />
            }
            label="Remember me"
          />
          <Button type="submit" variant="contained" size="large" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
          <Typography>
            New here?{' '}
            <Link component={RouterLink} to={location.search ? `/register${location.search}` : '/register'}>
              Create an account
            </Link>
          </Typography>
          <Typography>
            <Link component={RouterLink} to="/forgot-password">
              Forgot your password?
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Container>
  )
}

export default LoginPage
