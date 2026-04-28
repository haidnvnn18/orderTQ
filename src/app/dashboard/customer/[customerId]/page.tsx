import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { customerByIdOptions } from '@/features/customers/api/queries';
import PageContainer from '@/components/layout/page-container';
import CustomerViewPage from '@/features/customers/components/customer-view-page';

export const metadata = {
  title: 'Dashboard: Chi tiết khách hàng'
};

type PageProps = { params: Promise<{ customerId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  const queryClient = getQueryClient();

  if (params.customerId !== 'new') {
    void queryClient.prefetchQuery(customerByIdOptions(params.customerId));
  }

  return (
    <PageContainer>
      <div className='flex-1 space-y-4'>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <CustomerViewPage customerId={params.customerId} />
        </HydrationBoundary>
      </div>
    </PageContainer>
  );
}
