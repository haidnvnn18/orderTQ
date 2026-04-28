import { queryOptions } from '@tanstack/react-query';
import { getOrders, getOrderById } from './service';
import type { OrderFilters, OrderSummary, OrderDetail } from './types';

export type { OrderSummary, OrderDetail };

export const orderKeys = {
  all: ['orders'] as const,
  list: (filters: OrderFilters) => [...orderKeys.all, 'list', filters] as const,
  detail: (id: string) => [...orderKeys.all, 'detail', id] as const
};

export const ordersQueryOptions = (filters: OrderFilters) =>
  queryOptions({
    queryKey: orderKeys.list(filters),
    queryFn: () => getOrders(filters)
  });

export const orderByIdOptions = (id: string) =>
  queryOptions({
    queryKey: orderKeys.detail(id),
    queryFn: () => getOrderById(id),
    staleTime: 0 // Luôn refetch để đảm bảo timeline mới nhất
  });
