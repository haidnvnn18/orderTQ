import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createOrder, updateOrderStatus, deleteOrder } from './service';
import { orderKeys } from './queries';
import type { CreateOrderPayload, UpdateOrderStatusPayload } from './types';

export const createOrderMutation = mutationOptions({
  mutationFn: (data: CreateOrderPayload) => createOrder(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
  }
});

export const updateOrderStatusMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: UpdateOrderStatusPayload }) =>
    updateOrderStatus(id, data),
  onSuccess: (_result, { id }) => {
    getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
    getQueryClient().invalidateQueries({ queryKey: orderKeys.detail(id) });
  }
});

export const deleteOrderMutation = mutationOptions({
  mutationFn: (id: string) => deleteOrder(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
  }
});
