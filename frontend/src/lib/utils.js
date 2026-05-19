import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs) => twMerge(clsx(inputs));

/** Extract a user-readable message from an Axios error response. */
export const getApiError = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.error ||
  err?.response?.data?.message ||
  err?.message ||
  fallback;

export const formatPrice = (price) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

/**
 * Returns the display thumbnail URL for a product.
 * Uses the default variant's first image when variants exist.
 */
export const getProductThumbnail = (product) => {
  if (product.variants?.length > 0) {
    const def = product.variants.find((v) => v.isDefault) ?? product.variants[0];
    return def?.images?.[0] || product.images?.[0] || '';
  }
  return product.images?.[0] ?? '';
};

/**
 * Returns the effective display price for a product.
 * Uses the default variant's price when variants exist.
 */
export const getEffectivePrice = (product) => {
  if (!product.variants?.length) return product.price;
  const def = product.variants.find((v) => v.isDefault) ?? product.variants[0];
  return def?.price ?? product.price;
};
