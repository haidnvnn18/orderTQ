'use client';

import { useQuery } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import CustomerForm from './customer-form';
import { customerByIdOptions } from '../api/queries';
import { Icons } from '@/components/icons';

type TCustomerViewPageProps = {
  customerId: string;
};

export default function CustomerViewPage({ customerId }: TCustomerViewPageProps) {
  if (customerId === 'new') {
    return <CustomerForm initialData={null} pageTitle='Tạo khách hàng mới' />;
  }

  return <EditCustomerView customerId={customerId} />;
}

function EditCustomerView({ customerId }: { customerId: string }) {
  const { data, isLoading, isError } = useQuery({
    ...customerByIdOptions(customerId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always'
  });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Icons.spinner className='mr-2 h-6 w-6 animate-spin' />
        <span>Đang tải thông tin khách hàng...</span>
      </div>
    );
  }

  if (isError || !data?.customer) {
    notFound();
  }

  return <CustomerForm initialData={data.customer} pageTitle='Chỉnh sửa khách hàng' />;
}
