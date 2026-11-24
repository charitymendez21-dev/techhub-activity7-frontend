export function getSafeReturnUrl(value: string | null): string {
  if (!value || !value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/'
  }
  return value
}

const authPaths = ['/login', '/register', '/forgot-password', '/reset-password']
const customerPaths = ['/cart', '/checkout', '/orders', '/profile', '/notifications']

function matchesPath(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function getPostLoginUrl(value: string | null, role: 'customer' | 'admin'): string {
  const destination = value ? getSafeReturnUrl(value) : '/products'
  const pathname = destination.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/'

  if (
    authPaths.includes(pathname)
    || (role === 'admin' && customerPaths.some((path) => matchesPath(pathname, path)))
    || (role === 'customer' && matchesPath(pathname, '/admin'))
  ) {
    return '/products'
  }

  return destination
}
