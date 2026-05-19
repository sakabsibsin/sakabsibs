import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import * as api from './api';

export const productKeys = {
  all: ['products'],
  lists: () => [...productKeys.all, 'list'],
  list: (params) => [...productKeys.lists(), params],
  featured: () => [...productKeys.all, 'featured'],
  detail: (id) => [...productKeys.all, 'detail', id],
  stats: () => [...productKeys.all, 'stats'],
};

export const useProducts = (params = {}) =>
  useQuery({ queryKey: productKeys.list(params), queryFn: () => api.fetchProducts(params) });

export const useFeaturedProducts = () =>
  useQuery({ queryKey: productKeys.featured(), queryFn: api.fetchFeaturedProducts });

export const useProduct = (id) =>
  useQuery({ queryKey: productKeys.detail(id), queryFn: () => api.fetchProduct(id), enabled: !!id });

export const useProductStats = () =>
  useQuery({ queryKey: productKeys.stats(), queryFn: api.fetchProductStats });

// Create / Update / Delete — errors handled at callsite in ProductForm & ProductsPage
export const useCreateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.lists() });
      qc.invalidateQueries({ queryKey: productKeys.featured() });
      qc.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
};

export const useUpdateProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => api.updateProduct(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: productKeys.detail(id) });
      qc.invalidateQueries({ queryKey: productKeys.lists() });
      qc.invalidateQueries({ queryKey: productKeys.featured() });
      qc.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
};

export const useDeleteProduct = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteProduct,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: productKeys.lists() });
      qc.invalidateQueries({ queryKey: productKeys.stats() });
    },
  });
};

// Stock toggles — used in ProductsPage inline (no callsite onError), handle here
export const useToggleStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, inStock }) => api.toggleProductStock(id, inStock),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: productKeys.detail(id) });
      qc.invalidateQueries({ queryKey: productKeys.lists() });
    },
    onError: (err) => toast.error(getApiError(err, 'Failed to update stock. Please try again.')),
  });
};

export const useToggleVariantStock = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, variantId, inStock }) =>
      api.toggleVariantStock(productId, variantId, inStock),
    onSuccess: (_data, { productId }) => {
      qc.invalidateQueries({ queryKey: productKeys.detail(productId) });
      qc.invalidateQueries({ queryKey: productKeys.lists() });
    },
    onError: (err) => toast.error(getApiError(err, 'Failed to update variant stock.')),
  });
};

// Demand registration — fire-and-forget, silently failed before
export const useRegisterDemand = () =>
  useMutation({
    mutationFn: api.registerProductDemand,
    onError: (err) => toast.error(getApiError(err, 'Could not register your interest. Please try again.')),
  });

export const useRegisterVariantDemand = () =>
  useMutation({
    mutationFn: ({ productId, variantId }) => api.registerVariantDemand(productId, variantId),
    onError: (err) => toast.error(getApiError(err, 'Could not register your interest. Please try again.')),
  });
