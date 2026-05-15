import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  codePrefix: z.string().min(1, 'Code prefix is required').max(4),
});
