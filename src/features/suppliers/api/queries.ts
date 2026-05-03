import { queryOptions } from '@tanstack/react-query';
import { getSuppliers, getSupplierById, getSuppliersList } from './service';

export const supplierKeys = {
  all: ['suppliers'] as const,
  list: () => [...supplierKeys.all, 'list'] as const,
  detail: (id: string) => [...supplierKeys.all, 'detail', id] as const,
  dropdown: () => [...supplierKeys.all, 'dropdown'] as const
};

export const suppliersQueryOptions = () =>
  queryOptions({
    queryKey: supplierKeys.list(),
    queryFn: () => getSuppliers()
  });

export const supplierByIdOptions = (id: string) =>
  queryOptions({
    queryKey: supplierKeys.detail(id),
    queryFn: () => getSupplierById(id),
    enabled: !!id
  });

export const suppliersDropdownOptions = () =>
  queryOptions({
    queryKey: supplierKeys.dropdown(),
    queryFn: () => getSuppliersList()
  });
