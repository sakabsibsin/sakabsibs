import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from './api';

const keys = { all: ['categories'] };

export const useCategories = () => useQuery({ queryKey: keys.all, queryFn: api.fetchCategories });

export const useCreateCategory = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.createCategory, onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }) });
};

export const useUpdateCategory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }) => api.updateCategory(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
  });
};

export const useDeleteCategory = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.deleteCategory, onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }) });
};
