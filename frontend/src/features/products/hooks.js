import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiError } from '@/lib/utils';
import { PAGE_SIZE } from '@/constants/config';
import * as api from './api';

export const productKeys = {
  all: ['products'],
  lists: () => [...productKeys.all, 'list'],
  list: (params) => [...productKeys.lists(), params],
  featured: () => [...productKeys.all, 'featured'],
  detail: (id) => [...productKeys.all, 'detail', id],
  stats: () => [...productKeys.all, 'stats'],
};

export const useProducts = (params = {}, options = {}) =>
  useQuery({ queryKey: productKeys.list(params), queryFn: () => api.fetchProducts(params), ...options });

export const useFeaturedProducts = (options = {}) =>
  useQuery({ queryKey: productKeys.featured(), queryFn: api.fetchFeaturedProducts, ...options });

export const useProduct = (id, options = {}) =>
  useQuery({ queryKey: productKeys.detail(id), queryFn: () => api.fetchProduct(id), enabled: !!id, ...options });

export const useProductStats = (options = {}) =>
  useQuery({ queryKey: productKeys.stats(), queryFn: api.fetchProductStats, ...options });

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

export const useInfiniteProducts = ({ search = '', category = '', sort = '', anyOutOfStock = false } = {}) => {
  return useInfiniteQuery({
    // Nest under productKeys.lists() so mutations that invalidate the list
    // prefix (toggle stock, delete, create) also bust this infinite cache.
    // Previously `['products', 'infinite', ...]` was a sibling of
    // `['products', 'list']`, so `productKeys.lists()` invalidations never
    // reached the paginated query.
    queryKey: [...productKeys.lists(), 'infinite', { search, category, sort, anyOutOfStock }],
    queryFn: ({ pageParam }) => api.fetchProductsPage({ pageParam, search, category, sort, anyOutOfStock }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      if (!lastPage.hasMore) return undefined;
      return lastPageParam + PAGE_SIZE;
    },
    staleTime: 1000 * 60 * 5,
  });
};
