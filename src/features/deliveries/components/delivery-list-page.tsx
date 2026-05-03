'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { format } from 'date-fns';

import { deliveryListOptions } from '../api/queries';
import type { DeliveryFilters } from '../api/types';

import PageContainer from '@/components/layout/page-container';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PACKING: { label: 'Đang đóng gói', color: 'bg-slate-500' },
  SHIPPED: { label: 'Đang giao hàng', color: 'bg-blue-500' },
  DELIVERED: { label: 'Giao thành công', color: 'bg-green-500' },
  RETURNED: { label: 'Bị hoàn trả', color: 'bg-red-500' }
};

export function DeliveryListPage({ filters }: { filters: DeliveryFilters }) {
  const router = useRouter();
  const { data } = useSuspenseQuery(deliveryListOptions(filters));
  const [search, setSearch] = useQueryState('search', { defaultValue: '' });

  return (
    <PageContainer>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Phiếu giao hàng</h1>
          <p className='text-muted-foreground'>
            Quản lý các phiếu giao hàng cho khách hàng tại Việt Nam
          </p>
        </div>
      </div>

      <div className='flex items-center space-x-2 mb-6'>
        <div className='relative w-full max-w-sm'>
          <Icons.search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Tìm mã vận đơn, tên khách, mã đơn...'
            className='pl-8'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className='text-sm text-muted-foreground ml-4'>
          💡 Gợi ý: Để tạo phiếu giao mới, hãy vào Chi tiết Đơn hàng cụ thể.
        </div>
      </div>

      <div className='rounded-md border bg-card'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã phiếu</TableHead>
              <TableHead>Mã Đơn / Khách</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Đơn vị VC / Mã Bill</TableHead>
              <TableHead>Số SP</TableHead>
              <TableHead>Ngày tạo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.deliveries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center h-24 text-muted-foreground'>
                  Chưa có phiếu giao hàng nào
                </TableCell>
              </TableRow>
            ) : (
              data.deliveries.map((del) => (
                <TableRow
                  key={del.id}
                  className='cursor-pointer hover:bg-muted/50'
                  onClick={() => router.push(`/dashboard/delivery/${del.id}`)}
                >
                  <TableCell className='font-medium'>{del.deliveryCode}</TableCell>
                  <TableCell>
                    <div className='font-medium'>{del.order.orderNumber}</div>
                    <div className='text-xs text-muted-foreground'>{del.order.customer.name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant='secondary'
                      className={`${STATUS_MAP[del.status]?.color || 'bg-gray-500'} text-white`}
                    >
                      {STATUS_MAP[del.status]?.label || del.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className='text-sm'>
                      {del.shippingUnit ? (
                        <span className='font-medium'>{del.shippingUnit}</span>
                      ) : (
                        <span className='text-muted-foreground'>Chưa có</span>
                      )}
                      {del.trackingNumber && (
                        <div className='text-xs text-muted-foreground'>{del.trackingNumber}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{del._count.deliveryItems} SP</TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {format(new Date(del.createdAt), 'dd/MM/yyyy')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </PageContainer>
  );
}
