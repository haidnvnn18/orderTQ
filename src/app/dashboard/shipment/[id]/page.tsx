import { Suspense } from 'react';
import { getQueryClient } from '@/lib/query-client';
import { shipmentDetailOptions } from '@/features/shipments/api/queries';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { ShipmentDetailPage } from '@/features/shipments/components/shipment-detail-page';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Chi tiết kiện hàng',
  description: 'Quản lý thông tin và trạng thái kiện hàng'
};

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(shipmentDetailOptions(id));

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
        <ShipmentDetailPage id={id} />
      </Suspense>
    </HydrationBoundary>
  );
}
