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
import { Link as RouterLink } from 'react-router-dom'
import { api, getCsrfCookie, getErrorMessage } from '../api/client'

function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const mutation = useMutation({
    mutationFn: async () => {
      await getCsrfCookie()
      const response = await api.post<{ message: string }>('/forgot-password', { email })
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
            Reset your password
          </Typography>
          <Typography color="text.secondary">
            Enter your email and we’ll send a reset link if an account exists.
          </Typography>
          {mutation.isError && <Alert severity="error">{getErrorMessage(mutation.error)}</Alert>}
          {mutation.isSuccess && <Alert severity="success">{mutation.data}</Alert>}
          <TextField
            label="Email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" size="large" disabled={mutation.isPending}>
            {mutation.isPending ? 'Sending…' : 'Send reset link'}
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

export default ForgotPasswordPage
