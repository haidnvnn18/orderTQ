import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import {
  createShipmentBatch,
  updateShipmentBatchStatus,
  addItemsToBatch,
  updateBatchItem,
  removeBatchItem
} from './service';
import { shipmentKeys } from './queries';
import { orderKeys } from '@/features/orders/api/queries';

export const createShipmentBatchMutation = mutationOptions({
  mutationFn: createShipmentBatch,
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: shipmentKeys.all });
  }
});

export const updateShipmentBatchMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: any }) => updateShipmentBatchStatus(id, data),
  onSuccess: (_, variables) => {
    getQueryClient().invalidateQueries({ queryKey: shipmentKeys.all });
    getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
  }
});

export const addItemsToBatchMutation = mutationOptions({
  mutationFn: ({ batchId, data }: { batchId: string; data: any }) => addItemsToBatch(batchId, data),
  onSuccess: (_, variables) => {
    getQueryClient().invalidateQueries({ queryKey: shipmentKeys.detail(variables.batchId) });
    getQueryClient().invalidateQueries({ queryKey: shipmentKeys.picker() });
  }
});

export const updateBatchItemMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: any }) => updateBatchItem(id, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: shipmentKeys.all });
  }
});

export const removeBatchItemMutation = mutationOptions({
  mutationFn: removeBatchItem,
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: shipmentKeys.all });
    getQueryClient().invalidateQueries({ queryKey: shipmentKeys.picker() });
  }
});
