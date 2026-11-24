import { useState, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
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
import { Link as RouterLink, useSearchParams } from 'react-router-dom'
import { api, getCsrfCookie, getErrorMessage } from '../api/client'

function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') ?? ''
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const mutation = useMutation({
    mutationFn: async () => {
      await getCsrfCookie()
      const response = await api.post<{ message: string }>('/reset-password', {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      })
      return response.data.message
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    mutation.mutate()
  }

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper component="form" onSubmit={handleSubmit} elevation={2} sx={{ p: { xs: 3, sm: 5 } }}>
        <Stack spacing={2.5}>
          <Typography variant="h4" component="h1">
            Choose a new password
          </Typography>
          {!email || !token ? (
            <Alert severity="error">This reset link is incomplete. Request a new one.</Alert>
          ) : null}
          {mutation.isError && <Alert severity="error">{getErrorMessage(mutation.error)}</Alert>}
          {mutation.isSuccess && <Alert severity="success">{mutation.data}</Alert>}
          <TextField
            label="New password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            slotProps={{ htmlInput: { minLength: 8 } }}
            required
            fullWidth
            disabled={!email || !token}
          />
          <TextField
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            slotProps={{ htmlInput: { minLength: 8 } }}
            required
            fullWidth
            disabled={!email || !token}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={!email || !token || mutation.isPending}
          >
            {mutation.isPending ? 'Updating…' : 'Update password'}
          </Button>
          <Typography>
            <Link component={RouterLink} to="/login">
              Back to sign in
            </Link>
          </Typography>
        </Stack>
      </Paper>
    </Container>
  )
}

export default ResetPasswordPage
