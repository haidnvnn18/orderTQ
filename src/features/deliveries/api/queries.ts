import { queryOptions } from '@tanstack/react-query';
import { getDeliveries, getDeliveryById, getAvailableLineItemsForDelivery } from './service';
import type { DeliveryFilters } from './types';

export const deliveryKeys = {
  all: ['deliveries'] as const,
  list: (filters: DeliveryFilters) => [...deliveryKeys.all, 'list', filters] as const,
  detail: (id: string) => [...deliveryKeys.all, 'detail', id] as const,
  picker: (orderId: string) => [...deliveryKeys.all, 'picker', orderId] as const
};

export const deliveryListOptions = (filters: DeliveryFilters) =>
  queryOptions({
    queryKey: deliveryKeys.list(filters),
    queryFn: () => getDeliveries(filters)
  });

export const deliveryDetailOptions = (id: string) =>
  queryOptions({
    queryKey: deliveryKeys.detail(id),
    queryFn: () => getDeliveryById(id)
  });

export const deliveryPickerOptions = (orderId: string) =>
  queryOptions({
    queryKey: deliveryKeys.picker(orderId),
    queryFn: () => getAvailableLineItemsForDelivery(orderId),
    enabled: !!orderId
  });
