'use client';

import { useQuery } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import ProductForm from './product-form';
import { productByIdOptions } from '../api/queries';
import { Icons } from '@/components/icons';

type TProductViewPageProps = {
  productId: string;
};

export default function ProductViewPage({ productId }: TProductViewPageProps) {
  if (productId === 'new') {
    return <ProductForm initialData={null} pageTitle='Tạo sản phẩm mới' />;
  }

  return <EditProductView productId={productId} />;
}

function EditProductView({ productId }: { productId: string }) {
  const { data, isLoading, isError } = useQuery({
    ...productByIdOptions(productId),
    staleTime: 0, // Luôn coi data là cũ
    gcTime: 0, // Không giữ cache cũ
    refetchOnMount: 'always' // Bắt buộc refetch mỗi lần vào trang
  });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Icons.spinner className='mr-2 h-6 w-6 animate-spin' />
        <span>Đang tải thông tin sản phẩm...</span>
      </div>
    );
  }

  if (isError || !data?.product) {
    notFound();
  }

  return <ProductForm initialData={data.product} pageTitle='Chỉnh sửa sản phẩm' />;
}
