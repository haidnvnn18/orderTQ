import { Suspense } from 'react';
import { getQueryClient } from '@/lib/query-client';
import { deliveryDetailOptions } from '@/features/deliveries/api/queries';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { DeliveryDetailPage } from '@/features/deliveries/components/delivery-detail-page';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Chi tiết phiếu giao hàng',
  description: 'Chi tiết phiếu giao hàng'
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(deliveryDetailOptions(id));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className='p-8 space-y-4'>
            <Skeleton className='h-20 w-full' />
            <Skeleton className='h-[500px] w-full' />
          </div>
        }
      >
        <DeliveryDetailPage id={id} />
      </Suspense>
    </HydrationBoundary>
  );
}
