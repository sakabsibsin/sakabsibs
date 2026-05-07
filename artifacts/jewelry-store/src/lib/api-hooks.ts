import {
  useQuery,
  useMutation,
  type UseQueryOptions,
} from "@tanstack/react-query";

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

export type ListProductsParams = {
  category?: string;
  inStock?: boolean;
  featured?: boolean;
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

// ─── Base fetch ───────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Request failed" }));
    throw Object.assign(new Error(err.error || "Request failed"), {
      response: { data: err },
    });
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

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
  options?: { query?: Partial<UseQueryOptions<Product[]>> }
) {
  const qs = new URLSearchParams();
  if (params.category) qs.set("category", params.category);
  if (params.inStock !== undefined) qs.set("inStock", String(params.inStock));
  if (params.featured !== undefined) qs.set("featured", String(params.featured));
  if (params.limit !== undefined) qs.set("limit", String(params.limit));
  if (params.offset !== undefined) qs.set("offset", String(params.offset));
  const query = qs.toString();

  return useQuery<Product[]>({
    queryKey: getListProductsQueryKey(params),
    queryFn: () => apiFetch<Product[]>(`/products${query ? `?${query}` : ""}`),
    ...options?.query,
  });
}

export function useGetProduct(
  id: string,
  options?: { query?: Partial<UseQueryOptions<Product>> }
) {
  return useQuery<Product>({
    queryKey: getGetProductQueryKey(id),
    queryFn: () => apiFetch<Product>(`/products/${id}`),
    enabled: !!id,
    ...options?.query,
  });
}

export function useGetFeaturedProducts(
  options?: { query?: Partial<UseQueryOptions<Product[]>> }
) {
  return useQuery<Product[]>({
    queryKey: ["products-featured"],
    queryFn: () => apiFetch<Product[]>("/products/featured"),
    ...options?.query,
  });
}

export function useGetProductStats(
  options?: { query?: Partial<UseQueryOptions<ProductStats>> }
) {
  return useQuery<ProductStats>({
    queryKey: getGetProductStatsQueryKey(),
    queryFn: () => apiFetch<ProductStats>("/products/stats"),
    ...options?.query,
  });
}

export function useCreateProduct() {
  return useMutation<Product, Error, { data: CreateProductBody }>({
    mutationFn: ({ data }) =>
      apiFetch<Product>("/products", { method: "POST", body: JSON.stringify(data) }),
  });
}

export function useUpdateProduct() {
  return useMutation<Product, Error, { id: string; data: UpdateProductBody }>({
    mutationFn: ({ id, data }) =>
      apiFetch<Product>(`/products/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  });
}

export function useDeleteProduct() {
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) =>
      apiFetch<void>(`/products/${id}`, { method: "DELETE" }),
  });
}

export function useToggleProductStock() {
  return useMutation<Product, Error, { id: string; data: { inStock: boolean } }>({
    mutationFn: ({ id, data }) =>
      apiFetch<Product>(`/products/${id}/stock`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  });
}

// ─── Category Hooks ───────────────────────────────────────────────────────────

export function useListCategories(
  options?: { query?: Partial<UseQueryOptions<Category[]>> }
) {
  return useQuery<Category[]>({
    queryKey: getListCategoriesQueryKey(),
    queryFn: () => apiFetch<Category[]>("/categories"),
    ...options?.query,
  });
}

export function useCreateCategory() {
  return useMutation<Category, Error, { data: { name: string } }>({
    mutationFn: ({ data }) =>
      apiFetch<Category>("/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  });
}

export function useDeleteCategory() {
  return useMutation<void, Error, { id: string }>({
    mutationFn: ({ id }) =>
      apiFetch<void>(`/categories/${id}`, { method: "DELETE" }),
  });
}

// ─── Settings Hooks ───────────────────────────────────────────────────────────

export function useListSettings(
  options?: { query?: Partial<UseQueryOptions<Record<string, string>>> }
) {
  return useQuery<Record<string, string>>({
    queryKey: getListSettingsQueryKey(),
    queryFn: () => apiFetch<Record<string, string>>("/settings"),
    ...options?.query,
  });
}

export function useUpsertSetting() {
  return useMutation<
    { key: string; value: string },
    Error,
    { key: string; data: { value: string } }
  >({
    mutationFn: ({ key, data }) =>
      apiFetch<{ key: string; value: string }>(`/settings/${key}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  });
}

// ─── Storage Hook ─────────────────────────────────────────────────────────────

export function useRequestUploadUrl() {
  return useMutation<
    { uploadURL: string; objectPath: string },
    Error,
    { name: string; size: number; contentType: string }
  >({
    mutationFn: (data) =>
      apiFetch<{ uploadURL: string; objectPath: string }>(
        "/storage/uploads/request-url",
        { method: "POST", body: JSON.stringify(data) }
      ),
  });
}
