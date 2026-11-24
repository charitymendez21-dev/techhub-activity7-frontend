import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { cartApi } from '../api/cart'

export const cartQueryKey = ['cart'] as const

export function useCart(enabled = true) {
  return useQuery({
    queryKey: cartQueryKey,
    queryFn: cartApi.get,
    enabled,
    retry: false,
  })
}

export function useAddCartItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, quantity }: { productId: number; quantity: number }) =>
      cartApi.add(productId, quantity),
    onSuccess: (cart) => queryClient.setQueryData(cartQueryKey, cart),
  })
}
