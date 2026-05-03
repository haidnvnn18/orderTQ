import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import { suppliersQueryOptions } from '@/features/suppliers/api/queries';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { SupplierListPage } from '@/features/suppliers/components/supplier-list-page';

export const metadata = {
  title: 'Nhà cung cấp'
};

export default async function Page() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(suppliersQueryOptions());

  return (
    <PageContainer>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<Skeleton className='h-[400px] w-full' />}>
          <SupplierListPage />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
