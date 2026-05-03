import { queryOptions } from '@tanstack/react-query';
import { getChinaPOs, getChinaPOById, getPendingLineItems } from './service';
import type { ChinaPOFilters } from './types';

export const chinaPOKeys = {
  all: ['china-pos'] as const,
  lists: () => [...chinaPOKeys.all, 'list'] as const,
  list: (filters: ChinaPOFilters) => [...chinaPOKeys.lists(), filters] as const,
  details: () => [...chinaPOKeys.all, 'detail'] as const,
  detail: (id: string) => [...chinaPOKeys.details(), id] as const,
  pendingLineItems: () => [...chinaPOKeys.all, 'pending-line-items'] as const
};

export const chinaPOsQueryOptions = (filters: ChinaPOFilters) =>
  queryOptions({
    queryKey: chinaPOKeys.list(filters),
    queryFn: () => getChinaPOs(filters)
  });

export const chinaPOByIdOptions = (id: string) =>
  queryOptions({
    queryKey: chinaPOKeys.detail(id),
    queryFn: () => getChinaPOById(id),
    enabled: !!id
  });

export const pendingLineItemsQueryOptions = () =>
  queryOptions({
    queryKey: chinaPOKeys.pendingLineItems(),
    queryFn: () => getPendingLineItems()
  });
