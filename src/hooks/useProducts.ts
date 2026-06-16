import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '../api/products';
import type { RegisterProductRequest } from '../api/types';
import { useAuthStore } from '../stores/auth-store';

export function useProducts() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['products'],
    queryFn: () => productsApi.list(),
    enabled: isAuthenticated,
    retry: false,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterProductRequest) => productsApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });
}
