import {
  useQuery,
  useMutation,
  type UseQueryOptions,
} from "@tanstack/react-query";
import { productService } from "@/services/productService";
import { categoryService } from "@/services/categoryService";
import { settingsService } from "@/services/settingsService";

// ─── Types ────────────────────────────────────────────────────────────────────

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  material: string;
  category: string;
  productCode: string;
  inStock: boolean;
  featured: boolean;
  createdAt: string;
};

export type Category = {
  id: string;
  name: string;
  codePrefix: string;
  createdAt: string;
};

export type ProductStats = {
  total: number;
  inStock: number;
  outOfStock: number;
  featured: number;
  categories: { category: string; count: number }[];
};

export type ProductListResponse = {
  products: Product[];
  total: number;
  hasMore: boolean;
};

export type ListProductsParams = {
  category?: string;
  inStock?: boolean;
  featured?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
};

export type CreateProductBody = {
  name: string;
  description: string;
  price: number;
  images: string[];
  material: string;
  category: string;
  inStock: boolean;
  featured: boolean;
};

export type UpdateProductBody = Partial<CreateProductBody>;

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const getListProductsQueryKey = (params: ListProductsParams = {}) =>
  ["products", params] as const;

export const getGetProductQueryKey = (id: string) =>
  ["product", id] as const;

export const getGetProductStatsQueryKey = () =>
  ["product-stats"] as const;

export const getListCategoriesQueryKey = () =>
  ["categories"] as const;

export const getListSettingsQueryKey = () =>
  ["settings"] as const;

// ─── Product Hooks ────────────────────────────────────────────────────────────

export function useListProducts(
  params: ListProductsParams = {},
  options?: { query?: Partial<UseQueryOptions<ProductListResponse>> }
) {
  return useQuery<ProductListResponse>({
    queryKey: getListProductsQueryKey(params),
    queryFn: () => productService.list(params),
    ...options?.query,
  });
}

export function useGetProduct(
  id: string,
  options?: { query?: Partial<UseQueryOptions<Product>> }
) {
  return useQuery<Product>({
    queryKey: getGetProductQueryKey(id),
    queryFn: () => productService.get(id),
    enabled: !!id,
    ...options?.query,
  });
}

export function useGetFeaturedProducts(
  options?: { query?: Partial<UseQueryOptions<Product[]>> }
) {
  return useQuery<Product[]>({
    queryKey: ["products-featured"],
    queryFn: () => productService.featured(),
    ...options?.query,
  });
}

export function useGetProductStats(
  options?: { query?: Partial<UseQueryOptions<ProductStats>> }
) {
  return useQuery<ProductStats>({
    queryKey: getGetProductStatsQueryKey(),
    queryFn: () => productService.stats(),
    ...options?.query,
  });
}

export function useCreateProduct() {
  return useMutation<Product, Error, { data: CreateProductBody }>({
    mutationFn: ({ data }) => productService.create(data),
  });
}

export function useUpdateProduct() {
  return useMutation<Product, Error, { id: string; data: UpdateProductBody }>({
    mutationFn: ({ id, data }) => productService.update(id, data),
  });
}

export function useDeleteProduct() {
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => productService.remove(id),
  });
}

export function useToggleProductStock() {
  return useMutation<Product, Error, { id: string; data: { inStock: boolean } }>({
    mutationFn: ({ id, data }) => productService.toggleStock(id, data.inStock),
  });
}

// ─── Category Hooks ───────────────────────────────────────────────────────────

export function useListCategories(
  options?: { query?: Partial<UseQueryOptions<Category[]>> }
) {
  return useQuery<Category[]>({
    queryKey: getListCategoriesQueryKey(),
    queryFn: () => categoryService.list(),
    ...options?.query,
  });
}

export function useCreateCategory() {
  return useMutation<Category, Error, { data: { name: string } }>({
    mutationFn: ({ data }) => categoryService.create(data.name),
  });
}

export function useDeleteCategory() {
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) => categoryService.remove(id),
  });
}

// ─── Settings Hooks ───────────────────────────────────────────────────────────

export function useListSettings(
  options?: { query?: Partial<UseQueryOptions<Record<string, string>>> }
) {
  return useQuery<Record<string, string>>({
    queryKey: getListSettingsQueryKey(),
    queryFn: () => settingsService.list(),
    ...options?.query,
  });
}

export function useUpsertSetting() {
  return useMutation<
    { key: string; value: string },
    Error,
    { key: string; data: { value: string } }
  >({
    mutationFn: ({ key, data }) => settingsService.upsert(key, data.value),
  });
}
