import { api } from './client';
import type { Product, RegisterProductRequest } from './types';

export const productsApi = {
  list: () => api.get<Product[]>('/v1/products'),

  create: (body: RegisterProductRequest) =>
    api.post<Product>('/v1/products', body),

  get: (id: string) => api.get<Product>('/v1/products/' + id),
};
