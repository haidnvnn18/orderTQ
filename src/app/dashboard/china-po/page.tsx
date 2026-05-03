import { ChinaPOPage } from '@/features/china-pos/components/china-po-page';
import { getQueryClient } from '@/lib/query-client';
import {
  pendingLineItemsQueryOptions,
  chinaPOsQueryOptions
} from '@/features/china-pos/api/queries';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Đặt hàng Trung Quốc'
};

export default async function Page() {
  const queryClient = getQueryClient();

  // Prefetch cả 2 tabs
  void queryClient.prefetchQuery(pendingLineItemsQueryOptions());
  void queryClient.prefetchQuery(chinaPOsQueryOptions({ page: 1, limit: 10 }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<Skeleton className='h-[500px] w-full' />}>
        <ChinaPOPage />
      </Suspense>
    </HydrationBoundary>
  );
}
