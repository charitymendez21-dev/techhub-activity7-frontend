import { api } from './client'
import type { Paginated, ProductReview } from './products'

export type ReviewEligibility = {
  can_review: boolean
  has_reviewed: boolean
  my_review: ProductReview | null
}

export type AdminReview = ProductReview & {
  product: { id: number; name: string; slug: string }
}

export const reviewsApi = {
  eligibility: async (productId: number) =>
    (await api.get<{ data: ReviewEligibility }>(`/products/${productId}/review-eligibility`)).data.data,
  create: async (productId: number, values: { rating: number; comment: string }) =>
    (await api.post<{ data: ProductReview }>(`/products/${productId}/reviews`, values)).data.data,
  update: async (reviewId: number, values: { rating: number; comment: string }) =>
    (await api.put<{ data: ProductReview }>(`/reviews/${reviewId}`, values)).data.data,
  remove: async (reviewId: number) => api.delete(`/reviews/${reviewId}`),
  adminList: async (params: Record<string, string | number | undefined>) =>
    (await api.get<Paginated<AdminReview>>('/admin/reviews', { params })).data,
  adminRemove: async (reviewId: number) => api.delete(`/admin/reviews/${reviewId}`),
}
