import { api } from './client'

export type CatalogCategory = {
  id: number
  name: string
  slug: string
  products_count: number
}

export type CatalogBrand = {
  id: number
  name: string
  slug: string
  products_count: number
}

export type ProductSummary = {
  id: number
  name: string
  slug: string
  brand: Pick<CatalogBrand, 'id' | 'name' | 'slug'> | null
  category: Pick<CatalogCategory, 'id' | 'name' | 'slug'>
  image_url: string | null
  price: string
  sale_price: string | null
  rating: number | null
  reviews_count: number
  in_stock: boolean
}

export type ProductDetail = ProductSummary & {
  sku: string
  description: string | null
  stock_quantity: number
  low_stock_threshold: number
  is_featured: boolean
  images: Array<{
    id: number
    url: string
    is_primary: boolean
    sort_order: number
  }>
  rating_breakdown: Record<'1' | '2' | '3' | '4' | '5', number>
}

export type ProductReview = {
  id: number
  user: {
    first_name: string
    last_initial: string
    display_name: string
  }
  rating: number
  comment: string | null
  date: string
}

export type Paginated<T> = {
  data: T[]
  links: { first: string | null; last: string | null; prev: string | null; next: string | null }
  meta: { current_page: number; last_page: number; per_page: number; total: number }
}

export type ProductFilters = {
  price: { min: number; max: number }
  brands: CatalogBrand[]
  categories: CatalogCategory[]
}

export type ProductQuery = Record<string, string | number | boolean | undefined>

function nonEmptyParams(params: ProductQuery): ProductQuery {
  const query: ProductQuery = {}
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      query[key] = value
    }
  }
  return query
}

export const productApi = {
  categories: async () => (await api.get<{ data: CatalogCategory[] }>('/categories')).data.data,
  brands: async () => (await api.get<{ data: CatalogBrand[] }>('/brands')).data.data,
  filters: async (params: ProductQuery) =>
    (await api.get<{ data: ProductFilters }>('/products/filters', { params: nonEmptyParams(params) })).data.data,
  products: async (params: ProductQuery) =>
    (await api.get<Paginated<ProductSummary>>('/products', { params })).data,
  featured: async () =>
    (await api.get<{ data: ProductSummary[] }>('/products/featured')).data.data,
  product: async (slug: string) =>
    (await api.get<{ data: ProductDetail }>(`/products/${encodeURIComponent(slug)}`)).data.data,
  reviews: async (slug: string, page: number) =>
    (await api.get<Paginated<ProductReview>>(
      `/products/${encodeURIComponent(slug)}/reviews`,
      { params: { page, per_page: 5 } },
    )).data,
}
