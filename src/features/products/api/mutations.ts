import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createProduct, updateProduct, deleteProduct } from './service';
import { productKeys } from './queries';
import { chinaPOKeys } from '@/features/china-pos/api/queries';
import type { ProductMutationPayload } from './types';

export const createProductMutation = mutationOptions({
  mutationFn: (data: ProductMutationPayload) => createProduct(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: productKeys.all });
    getQueryClient().invalidateQueries({ queryKey: chinaPOKeys.pendingLineItems() });
  }
});

export const updateProductMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: string; values: ProductMutationPayload }) =>
    updateProduct(id, values),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: productKeys.all });
    getQueryClient().invalidateQueries({ queryKey: chinaPOKeys.pendingLineItems() });
  }
});

export const deleteProductMutation = mutationOptions({
  mutationFn: (id: string) => deleteProduct(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: productKeys.all });
  }
});
