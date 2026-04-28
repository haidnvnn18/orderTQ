import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { ordersQueryOptions } from '../api/queries';
import { OrderTable } from './order-tables';

export default function OrderListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('search');
  const status = searchParamsCache.get('status');
  const financialStatus = searchParamsCache.get('financialStatus');
  const pageLimit = searchParamsCache.get('perPage');
  const sort = searchParamsCache.get('sort');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(status && { status }),
    ...(financialStatus && { financialStatus }),
    ...(sort && { sort })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(ordersQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrderTable />
    </HydrationBoundary>
  );
}
