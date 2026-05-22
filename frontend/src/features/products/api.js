import { apiClient } from '@/lib/apiClient';
import { PAGE_SIZE } from '@/constants/config';

export const fetchProducts = async (params = {}) => {
  const { data } = await apiClient.get('/products', { params });
  return data.data;
};
export const fetchFeaturedProducts = async () => {
  const { data } = await apiClient.get('/products/featured');
  return data.data;
};
export const fetchProduct = async (id) => {
  const { data } = await apiClient.get(`/products/${id}`);
  return data.data;
};
export const fetchProductStats = async () => {
  const { data } = await apiClient.get('/products/stats');
  return data.data;
};
export const fetchRestockStats = async () => {
  const { data } = await apiClient.get('/products/restock-stats');
  return data.data;
};
export const createProduct = async (body) => {
  const { data } = await apiClient.post('/products', body);
  return data.data;
};
export const updateProduct = async (id, body) => {
  const { data } = await apiClient.put(`/products/${id}`, body);
  return data.data;
};
export const deleteProduct = async (id) => {
  await apiClient.delete(`/products/${id}`);
};
export const toggleProductStock = async (id, inStock) => {
  const { data } = await apiClient.patch(`/products/${id}/stock`, { inStock });
  return data.data;
};

export const registerProductDemand = async (id) => {
  const { data } = await apiClient.post(`/products/${id}/demand`);
  return data.data;
};

export const toggleVariantStock = async (productId, variantId, inStock) => {
  const { data } = await apiClient.patch(
    `/products/${productId}/variants/${variantId}/stock`,
    { inStock }
  );
  return data.data;
};

export const registerVariantDemand = async (productId, variantId) => {
  const { data } = await apiClient.post(
    `/products/${productId}/variants/${variantId}/demand`
  );
  return data.data;
};

export const fetchProductsPage = async ({ pageParam = 0, search, category, sort, anyOutOfStock, featured }) => {
  const params = new URLSearchParams();
  params.set('limit', PAGE_SIZE);
  params.set('offset', pageParam);
  if (search) params.set('search', search);
  if (category) params.set('category', category);
  if (sort) params.set('sort', sort);
  if (anyOutOfStock) params.set('anyOutOfStock', 'true');
  if (featured) params.set('featured', 'true');
  const { data } = await apiClient.get(`/products?${params.toString()}`);
  return data.data; // returns { products, total, hasMore }
};
