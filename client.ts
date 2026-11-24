import axios from 'axios'

const apiUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api'
const apiOrigin = apiUrl.replace(/\/api\/?$/, '')

export const api = axios.create({
  baseURL: apiUrl,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: 'application/json',
  },
})

export async function getCsrfCookie() {
  await axios.get(`${apiOrigin}/sanctum/csrf-cookie`, {
    withCredentials: true,
  })
}

export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<{ message?: string; errors?: Record<string, string[]> }>(error)) {
    const errors = error.response?.data?.errors
    const validationMessage = errors ? Object.values(errors).flat()[0] : undefined
    return validationMessage ?? error.response?.data?.message ?? 'The request could not be completed.'
  }

  return 'An unexpected error occurred.'
}
