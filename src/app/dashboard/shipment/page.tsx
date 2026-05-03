import { Suspense } from 'react';
import { getQueryClient } from '@/lib/query-client';
import { shipmentListOptions } from '@/features/shipments/api/queries';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { ShipmentListPage } from '@/features/shipments/components/shipment-list-page';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Kiện hàng vận chuyển',
  description: 'Quản lý các kiện hàng vận chuyển từ TQ về VN'
};

export default async function Page({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await searchParams;
  const page = Number(resolvedParams.page) || 1;
  const limit = Number(resolvedParams.limit) || 10;
  const search = (resolvedParams.search as string) || '';
  const status = (resolvedParams.status as string) || 'all';

  const filters = { page, limit, search, status: status as any };

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(shipmentListOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense
        fallback={
          <div className='p-8 space-y-4'>
            <Skeleton className='h-10 w-[200px]' />
            <Skeleton className='h-[400px] w-full' />
          </div>
        }
      >
        <ShipmentListPage filters={filters} />
      </Suspense>
    </HydrationBoundary>
  );
}
