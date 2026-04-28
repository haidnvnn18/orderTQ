import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createCustomer, updateCustomer, deleteCustomer } from './service';
import { customerKeys } from './queries';
import type { CustomerMutationPayload } from './types';

export const createCustomerMutation = mutationOptions({
  mutationFn: (data: CustomerMutationPayload) => createCustomer(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: customerKeys.all });
  }
});

export const updateCustomerMutation = mutationOptions({
  mutationFn: ({ id, values }: { id: string; values: CustomerMutationPayload }) =>
    updateCustomer(id, values),
  onSuccess: (_data, { id }) => {
    // Invalidate cả list lẫn detail của khách hàng vừa cập nhật
    getQueryClient().invalidateQueries({ queryKey: customerKeys.all });
    getQueryClient().invalidateQueries({ queryKey: customerKeys.detail(id) });
  }
});

export const deleteCustomerMutation = mutationOptions({
  mutationFn: (id: string) => deleteCustomer(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: customerKeys.all });
  }
});
