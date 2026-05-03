import { queryOptions } from '@tanstack/react-query';
import { getReturns } from './service';
import type { ReturnFilters } from './types';

export const returnKeys = {
  all: ['returns'] as const,
  list: (filters: ReturnFilters) => [...returnKeys.all, 'list', filters] as const
};

export const returnListOptions = (filters: ReturnFilters) =>
  queryOptions({
    queryKey: returnKeys.list(filters),
    queryFn: () => getReturns(filters)
  });
