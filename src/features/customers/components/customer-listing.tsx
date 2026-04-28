import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { customersQueryOptions } from '../api/queries';
import { CustomerTable } from './customer-tables';

export default function CustomerListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const sort = searchParamsCache.get('sort');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(sort && { sort })
  };

  const queryClient = getQueryClient();

  void queryClient.prefetchQuery(customersQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CustomerTable />
    </HydrationBoundary>
  );
}
