import { apiFetch } from './api';
import type { Product, CreateProductBody, UpdateProductBody, ListProductsParams, ProductStats } from '@/lib/api-hooks';

export function buildProductQuery(params: ListProductsParams): string {
  const qs = new URLSearchParams();
  if (params.category) qs.set('category', params.category);
  if (params.inStock !== undefined) qs.set('inStock', String(params.inStock));
  if (params.featured !== undefined) qs.set('featured', String(params.featured));
  if (params.limit !== undefined) qs.set('limit', String(params.limit));
  if (params.offset !== undefined) qs.set('offset', String(params.offset));
  return qs.toString();
}

export const productService = {
  list: (params: ListProductsParams = {}) => {
    const q = buildProductQuery(params);
    return apiFetch<Product[]>(`/products${q ? `?${q}` : ''}`);
  },
  get: (id: string) => apiFetch<Product>(`/products/${id}`),
  featured: () => apiFetch<Product[]>('/products/featured'),
  stats: () => apiFetch<ProductStats>('/products/stats'),
  create: (data: CreateProductBody) =>
    apiFetch<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: UpdateProductBody) =>
    apiFetch<Product>(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: string) => apiFetch<void>(`/products/${id}`, { method: 'DELETE' }),
  toggleStock: (id: string, inStock: boolean) =>
    apiFetch<Product>(`/products/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify({ inStock }),
    }),
};
