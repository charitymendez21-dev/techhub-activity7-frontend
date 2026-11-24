export type AuthUser = {
  id: number
  name: string
  first_name: string
  last_name: string
  email: string
  role: 'customer' | 'admin'
  phone: string | null
  avatar_url: string | null
}

export type ApiResource<T> = {
  data: T
}
