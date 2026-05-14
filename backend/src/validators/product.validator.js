import { z } from 'zod';

const variantSchema = z.object({
  color:       z.string().min(1, 'Color is required'),
  price:       z.coerce.number().min(0),
  images:      z.array(z.string()).optional().default([]),
  isDefault:   z.boolean().default(false),
  inStock:     z.boolean().default(true),
  demandCount: z.coerce.number().default(0),
});

const productBaseSchema = z.object({
  name:        z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  price:       z.coerce.number().min(0, 'Price must be non-negative'),
  images:      z.array(z.string()).default([]),
  material:    z.string().optional().default(''),
  category:    z.string().min(1, 'Category is required'),
  inStock:     z.boolean().default(true),
  featured:    z.boolean().default(false),
  variants:    z.array(variantSchema).optional().default([]),
});

export const createProductSchema = productBaseSchema.superRefine((data, ctx) => {
  if (!data.variants?.length && !data.images?.length) {
    ctx.addIssue({
      path: ['images'],
      code: z.ZodIssueCode.custom,
      message: 'At least one image is required when no variants are added',
    });
  }
});

export const updateProductSchema = productBaseSchema.partial();

export const toggleStockSchema = z.object({
  inStock: z.boolean(),
});

export const toggleVariantStockSchema = z.object({
  inStock: z.boolean(),
});
