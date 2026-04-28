import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import CustomerListingPage from '@/features/customers/components/customer-listing';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import Link from 'next/link';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Quản lý Khách hàng'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      pageTitle='Danh sách khách hàng'
      pageDescription='Quản lý thông tin khách hàng.'
      pageHeaderAction={
        <Link href='/dashboard/customer/new' className={cn(buttonVariants(), 'text-xs md:text-sm')}>
          <Icons.add className='mr-2 h-4 w-4' /> Thêm mới
        </Link>
      }
    >
      <CustomerListingPage />
    </PageContainer>
  );
}
