import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createChinaPO, updateChinaPOStatus } from './service';
import { chinaPOKeys } from './queries';
import { orderKeys } from '@/features/orders/api/queries';
import type { CreateChinaPOPayload, UpdateChinaPOPayload } from './types';

export const createChinaPOMutation = mutationOptions({
  mutationFn: (data: CreateChinaPOPayload) => createChinaPO(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: chinaPOKeys.all });
    // Đồng thời invalidate cả orders vì trạng thái LineItem / Order có thể đã thay đổi
    getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
  }
});

export const updateChinaPOStatusMutation = mutationOptions({
  mutationFn: ({ id, data }: { id: string; data: UpdateChinaPOPayload }) =>
    updateChinaPOStatus(id, data),
  onSuccess: (_result, { id }) => {
    getQueryClient().invalidateQueries({ queryKey: chinaPOKeys.all });
    getQueryClient().invalidateQueries({ queryKey: chinaPOKeys.detail(id) });
    getQueryClient().invalidateQueries({ queryKey: orderKeys.all });
  }
});
