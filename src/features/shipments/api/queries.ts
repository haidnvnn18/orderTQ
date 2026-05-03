import { queryOptions } from '@tanstack/react-query';
import { getShipmentBatches, getShipmentBatchById, getAvailableLineItemsForBatch } from './service';
import type { ShipmentBatchFilters } from './types';

export const shipmentKeys = {
  all: ['shipment-batches'] as const,
  list: (filters: ShipmentBatchFilters) => [...shipmentKeys.all, 'list', filters] as const,
  detail: (id: string) => [...shipmentKeys.all, 'detail', id] as const,
  picker: () => [...shipmentKeys.all, 'picker'] as const
};

export const shipmentListOptions = (filters: ShipmentBatchFilters) =>
  queryOptions({
    queryKey: shipmentKeys.list(filters),
    queryFn: () => getShipmentBatches(filters)
  });

export const shipmentDetailOptions = (id: string) =>
  queryOptions({
    queryKey: shipmentKeys.detail(id),
    queryFn: () => getShipmentBatchById(id)
  });

export const pickerLineItemsOptions = () =>
  queryOptions({
    queryKey: shipmentKeys.picker(),
    queryFn: () => getAvailableLineItemsForBatch()
  });
