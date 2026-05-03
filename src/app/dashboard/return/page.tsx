import { Suspense } from 'react';
import { getQueryClient } from '@/lib/query-client';
import { returnListOptions } from '@/features/returns/api/queries';
import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { ReturnListPage } from '@/features/returns/components/return-list-page';
import { Skeleton } from '@/components/ui/skeleton';

export const metadata = {
  title: 'Quản lý Hoàn trả',
  description: 'Quản lý yêu cầu hoàn trả'
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
  void queryClient.prefetchQuery(returnListOptions(filters));

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
        <ReturnListPage filters={filters} />
      </Suspense>
    </HydrationBoundary>
  );
}
