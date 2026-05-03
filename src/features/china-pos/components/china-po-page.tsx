'use client';

import PageContainer from '@/components/layout/page-container';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PendingItemsList } from './pending-items-list';
import { POListing } from './po-listing';

export function ChinaPOPage() {
  return (
    <PageContainer>
      <div className='flex items-center justify-between space-y-2 mb-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Đặt hàng Trung Quốc</h2>
          <p className='text-muted-foreground'>
            Gom đơn và quản lý các mã đơn đặt hàng (PO) gửi sang kho TQ.
          </p>
        </div>
      </div>

      <Tabs defaultValue='pending' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='pending'>Chờ đặt hàng</TabsTrigger>
          <TabsTrigger value='history'>Danh sách mã PO</TabsTrigger>
        </TabsList>
        <TabsContent value='pending' className='space-y-4'>
          <PendingItemsList />
        </TabsContent>
        <TabsContent value='history' className='space-y-4'>
          <POListing />
        </TabsContent>
      </Tabs>
    </PageContainer>
  );
}
