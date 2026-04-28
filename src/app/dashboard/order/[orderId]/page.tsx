import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { orderByIdOptions } from '@/features/orders/api/queries';
import PageContainer from '@/components/layout/page-container';
import OrderDetailPage from '@/features/orders/components/order-detail-page';

export const metadata = {
  title: 'Dashboard: Chi tiết đơn hàng'
};

type PageProps = { params: Promise<{ orderId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(orderByIdOptions(params.orderId));

  return (
    <PageContainer>
      <div className='flex-1 space-y-4'>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <OrderDetailPage orderId={params.orderId} />
        </HydrationBoundary>
      </div>
    </PageContainer>
  );
}
