import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createDelivery,
  updateDeliveryStatus,
  addItemsToDelivery,
  removeDeliveryItem
} from './service';
import { deliveryKeys } from './queries';
import { orderKeys } from '@/features/orders/api/queries';

export const createDeliveryMutation = mutationOptions({
  mutationFn: createDelivery,
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: deliveryKeys.all });
  }
});

export const updateDeliveryMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: any }) => updateDeliveryStatus(id, data),
  onSuccess: (_, variables) => {
    getQueryClient().invalidateQueries({ queryKey: deliveryKeys.all });
    getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
  }
});

export const addDeliveryItemsMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: any }) => addItemsToDelivery(id, data),
  onSuccess: (_, variables) => {
    getQueryClient().invalidateQueries({ queryKey: deliveryKeys.detail(variables.id) });
    // We should ideally invalidate the picker query as well, but we need orderId.
    // Usually invalidating 'all' or relying on refetch on modal open works.
    getQueryClient().invalidateQueries({ queryKey: deliveryKeys.all });
  }
});

export const removeDeliveryItemMutation = mutationOptions({
  mutationFn: removeDeliveryItem,
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: deliveryKeys.all });
  }
});
