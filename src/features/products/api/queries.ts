import { queryOptions } from '@tanstack/react-query';
import { getProducts, getProductById } from './service';
import type { ProductFilters, ProductListItem, Product } from './types';

export type { Product, ProductListItem };

export const productKeys = {
  all: ['products'] as const,
  list: (filters: ProductFilters) => [...productKeys.all, 'list', filters] as const,
  detail: (id: string) => [...productKeys.all, 'detail', id] as const
};

export const productsQueryOptions = (filters: ProductFilters) =>
  queryOptions({
    queryKey: productKeys.list(filters),
    queryFn: () => getProducts(filters)
  });

export const productByIdOptions = (id: string) =>
  queryOptions({
    queryKey: productKeys.detail(id),
    queryFn: () => getProductById(id),
    staleTime: 0 // Luôn refetch khi vào trang chi tiết để đảm bảo data mới nhất
  });
