import { queryOptions } from '@tanstack/react-query';
import { getCustomers, getCustomerById } from './service';
import type { CustomerFilters, CustomerSummary, CustomerDetail } from './types';

export type { CustomerSummary, CustomerDetail };

export const customerKeys = {
  all: ['customers'] as const,
  list: (filters: CustomerFilters) => [...customerKeys.all, 'list', filters] as const,
  detail: (id: string) => [...customerKeys.all, 'detail', id] as const
};

export const customersQueryOptions = (filters: CustomerFilters) =>
  queryOptions({
    queryKey: customerKeys.list(filters),
    queryFn: () => getCustomers(filters)
  });

export const customerByIdOptions = (id: string) =>
  queryOptions({
    queryKey: customerKeys.detail(id),
    queryFn: () => getCustomerById(id),
    staleTime: 0 // Luôn refetch khi vào trang chi tiết để tránh cache cũ
  });
