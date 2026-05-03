import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createReturn, updateReturnStatus } from './service';
import { returnKeys } from './queries';

export const createReturnMutation = mutationOptions({
  mutationFn: createReturn,
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: returnKeys.all });
  }
});

export const updateReturnMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: any }) => updateReturnStatus(id, data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: returnKeys.all });
  }
});
