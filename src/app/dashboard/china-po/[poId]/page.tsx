import { PODetailPage } from '@/features/china-pos/components/po-detail-page';
import { getQueryClient } from '@/lib/query-client';
import { chinaPOByIdOptions } from '@/features/china-pos/api/queries';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Chi tiết Đơn đặt hàng TQ'
};

export default async function Page({ params }: { params: Promise<{ poId: string }> }) {
  const { poId } = await params;
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(chinaPOByIdOptions(poId));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<Skeleton className='h-[500px] w-full' />}>
        <PODetailPage poId={poId} />
      </Suspense>
    </HydrationBoundary>
  );
}
