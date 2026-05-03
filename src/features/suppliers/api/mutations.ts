import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createSupplier, updateSupplier, deleteSupplier } from './service';
import { supplierKeys } from './queries';

export const createSupplierMutation = mutationOptions({
  mutationFn: (data: {
    name: string;
    platformUrl?: string | null;
    contactInfo?: string | null;
    reliabilityScore?: number;
  }) => createSupplier(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: supplierKeys.all });
  }
});

export const updateSupplierMutation = mutationOptions({
  mutationFn: ({
    id,
    data
  }: {
    id: string;
    data: {
      name?: string;
      platformUrl?: string | null;
      contactInfo?: string | null;
      reliabilityScore?: number;
    };
  }) => updateSupplier(id, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: supplierKeys.all });
  }
});

export const deleteSupplierMutation = mutationOptions({
  mutationFn: (id: string) => deleteSupplier(id),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: supplierKeys.all });
  }
});
