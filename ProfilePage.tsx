import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert,
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { profileApi } from '../api/profile'
import { getFieldErrors } from '../api/admin'
import { authUserQueryKey, useAuthUser } from '../hooks/useAuthUser'
import type { AuthUser } from '../types'

type ProfileForm = { first_name: string; last_name: string; email: string; phone: string; current_password: string }
type PasswordForm = { current_password: string; password: string; password_confirmation: string }

const emptyPassword: PasswordForm = { current_password: '', password: '', password_confirmation: '' }

function ProfilePage() {
  const queryClient = useQueryClient()
  const [savedValues, setSavedValues] = useState<ProfileForm | null>(null)
  const [password, setPassword] = useState(emptyPassword)
  const [showPasswords, setShowPasswords] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [feedback, setFeedback] = useState('')
  const userQuery = useAuthUser()
  const values = savedValues ?? {
    first_name: userQuery.data?.first_name ?? '',
    last_name: userQuery.data?.last_name ?? '',
    email: userQuery.data?.email ?? '',
    phone: userQuery.data?.phone ?? '',
    current_password: '',
  }
  const previewUrl = useMemo(() => avatarFile ? URL.createObjectURL(avatarFile) : null, [avatarFile])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const refreshUser = (user: AuthUser) => {
    queryClient.setQueryData(authUserQueryKey, user)
    setSavedValues({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone: user.phone ?? '',
      current_password: '',
    })
    setAvatarFile(null)
  }
  const profileMutation = useMutation({
    mutationFn: () => profileApi.update({
      first_name: values.first_name,
      last_name: values.last_name,
      email: values.email,
      phone: values.phone,
      ...(values.email !== userQuery.data?.email ? { current_password: values.current_password } : {}),
    }),
    onSuccess: (user) => {
      refreshUser(user)
      setFeedback('Profile updated.')
    },
  })
  const avatarMutation = useMutation({
    mutationFn: (file: File | null) => file
      ? profileApi.uploadAvatar(file)
      : profileApi.deleteAvatar(),
    onSuccess: (user, file) => {
      refreshUser(user)
      setFeedback(file ? 'Avatar updated.' : 'Avatar removed.')
    },
  })
  const passwordMutation = useMutation({
    mutationFn: () => profileApi.changePassword(password),
    onSuccess: () => {
      setPassword(emptyPassword)
      setFeedback('Password updated. Other sessions have been signed out.')
    },
  })
  const profileErrors = getFieldErrors(profileMutation.error)
  const avatarErrors = getFieldErrors(avatarMutation.error)
  const passwordErrors = getFieldErrors(passwordMutation.error)

  function submitProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    profileMutation.mutate()
  }

  function submitPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    passwordMutation.mutate()
  }

  function selectAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.item(0) ?? null
    setAvatarFile(file && file.size > 0 ? file : null)
    if (!file) event.target.value = ''
  }

  if (userQuery.isPending) {
    return <Box sx={{ minHeight: 300, display: 'grid', placeItems: 'center' }}><CircularProgress /></Box>
  }
  if (userQuery.isError) return <Alert severity="error">Unable to load your profile.</Alert>
  if (!userQuery.data) return <Alert severity="warning">Please sign in to view your profile.</Alert>

  return (
    <Stack spacing={3} maxWidth={820} sx={{ mx: 'auto' }}>
      <Typography variant="h4" component="h1" fontWeight={700}>Your profile</Typography>
      <Paper component="form" onSubmit={submitProfile} sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="h6">Personal information</Typography>
          {profileMutation.isError && <Alert severity="error">Please review the highlighted fields.</Alert>}
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="First name" value={values.first_name} onChange={(e) => setSavedValues({ ...values, first_name: e.target.value })} error={Boolean(profileErrors.first_name)} helperText={profileErrors.first_name} fullWidth required />
            <TextField label="Last name" value={values.last_name} onChange={(e) => setSavedValues({ ...values, last_name: e.target.value })} error={Boolean(profileErrors.last_name)} helperText={profileErrors.last_name} fullWidth required />
          </Stack>
          <TextField label="Email" type="email" value={values.email} onChange={(e) => setSavedValues({ ...values, email: e.target.value })} error={Boolean(profileErrors.email)} helperText={profileErrors.email} required />
          {values.email !== userQuery.data.email && (
            <TextField label="Current password (required to change email)" type="password" value={values.current_password} onChange={(e) => setSavedValues({ ...values, current_password: e.target.value })} error={Boolean(profileErrors.current_password)} helperText={profileErrors.current_password} required />
          )}
          <TextField label="Phone" value={values.phone} onChange={(e) => setSavedValues({ ...values, phone: e.target.value })} error={Boolean(profileErrors.phone)} helperText={profileErrors.phone} />
          <Button type="submit" variant="contained" disabled={profileMutation.isPending} sx={{ alignSelf: 'flex-start' }}>
            {profileMutation.isPending ? 'Saving…' : 'Save profile'}
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2} alignItems="flex-start">
          <Typography variant="h6">Avatar</Typography>
          <Avatar src={previewUrl ?? userQuery.data.avatar_url ?? undefined} sx={{ width: 96, height: 96 }}>
            {userQuery.data.first_name.slice(0, 1)}
          </Avatar>
          {avatarMutation.isError && (
            <Alert severity="error">{avatarErrors.avatar ?? 'Unable to update avatar.'}</Alert>
          )}
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Button component="label" variant="outlined" disabled={avatarMutation.isPending}>
              Choose image
              <input hidden type="file" accept="image/jpeg,image/png,image/webp" onChange={selectAvatar} />
            </Button>
            <Button
              variant="contained"
              onClick={() => avatarFile && avatarMutation.mutate(avatarFile)}
              disabled={!avatarFile || avatarMutation.isPending}
            >
              {avatarMutation.isPending ? 'Uploading…' : 'Upload'}
            </Button>
            <Button
              color="error"
              onClick={() => avatarMutation.mutate(null)}
              disabled={!userQuery.data.avatar_url || avatarMutation.isPending}
            >
              Remove avatar
            </Button>
          </Stack>
          {avatarFile && <Typography variant="body2">{avatarFile.name}</Typography>}
        </Stack>
      </Paper>

      <Paper component="form" onSubmit={submitPassword} sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="h6">Change password</Typography>
          {passwordMutation.isError && <Alert severity="error">Please review the highlighted fields.</Alert>}
          <TextField
            label="Current password"
            type={showPasswords ? 'text' : 'password'}
            value={password.current_password}
            onChange={(e) => setPassword({ ...password, current_password: e.target.value })}
            error={Boolean(passwordErrors.current_password)}
            helperText={passwordErrors.current_password}
            InputProps={{ endAdornment: (
              <InputAdornment position="end">
                <IconButton aria-label={showPasswords ? 'Hide passwords' : 'Show passwords'} onClick={() => setShowPasswords((show) => !show)} edge="end">
                  {showPasswords ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ) }}
            required
          />
          <TextField
            label="New password"
            type={showPasswords ? 'text' : 'password'}
            value={password.password}
            onChange={(e) => setPassword({ ...password, password: e.target.value })}
            error={Boolean(passwordErrors.password)}
            helperText={passwordErrors.password}
            required
          />
          <TextField
            label="Confirm new password"
            type={showPasswords ? 'text' : 'password'}
            value={password.password_confirmation}
            onChange={(e) => setPassword({ ...password, password_confirmation: e.target.value })}
            required
          />
          <Button type="submit" variant="contained" disabled={passwordMutation.isPending} sx={{ alignSelf: 'flex-start' }}>
            {passwordMutation.isPending ? 'Updating…' : 'Update password'}
          </Button>
        </Stack>
      </Paper>
      <Snackbar open={Boolean(feedback)} autoHideDuration={3500} onClose={() => setFeedback('')} message={feedback} />
    </Stack>
  )
}

export default ProfilePage
