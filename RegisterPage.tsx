import { useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Button,
  Container,
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
import { getSafeReturnUrl } from '../utils/navigation'

function RegisterPage() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const registerMutation = useMutation({
    mutationFn: async () => {
      await getCsrfCookie()
      const response = await api.post<ApiResource<AuthUser>>('/register', {
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      })
      return response.data.data
    },
    onSuccess: (user) => {
      queryClient.setQueryData(authUserQueryKey, user)
      navigate(getSafeReturnUrl(new URLSearchParams(location.search).get('returnUrl')), { replace: true })
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    registerMutation.mutate()
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper component="form" onSubmit={handleSubmit} elevation={2} sx={{ p: { xs: 3, sm: 5 } }}>
        <Stack spacing={2.5}>
          <Typography variant="h4" component="h1">
            Create an account
          </Typography>
          {registerMutation.isError && (
            <Alert severity="error">{getErrorMessage(registerMutation.error)}</Alert>
          )}
          <TextField
            label="Name"
            autoComplete="name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            fullWidth
          />
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
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            slotProps={{ htmlInput: { minLength: 8 } }}
            required
            fullWidth
          />
          <TextField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            slotProps={{ htmlInput: { minLength: 8 } }}
            required
            fullWidth
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? 'Creating account…' : 'Create account'}
          </Button>
          <Typography>
            Already registered?{' '}
            <Link component={RouterLink} to={location.search ? `/login${location.search}` : '/login'}>
              Sign in
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Container>
  )
}

export default RegisterPage
