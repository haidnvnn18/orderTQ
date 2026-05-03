'use client';

import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { useQueryState } from 'nuqs';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { returnListOptions } from '../api/queries';
import { updateReturnMutation } from '../api/mutations';
import type { ReturnFilters } from '../api/types';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { ReturnStatus } from '@prisma/client';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  REQUESTED: { label: 'Yêu cầu', color: 'bg-yellow-500' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-blue-500' },
  REJECTED: { label: 'Từ chối', color: 'bg-red-500' },
  RECEIVED_VN: { label: 'Đã nhận kho VN', color: 'bg-purple-500' },
  REFUNDED: { label: 'Đã hoàn tiền', color: 'bg-green-500' }
};

const REASON_MAP: Record<string, string> = {
  DEFECTIVE: 'Hàng lỗi',
  WRONG_ITEM: 'Gửi nhầm',
  WRONG_SIZE: 'Sai size/màu',
  CUSTOMER_CHANGE: 'Khách đổi ý',
  OTHER: 'Khác'
};

export function ReturnListPage({ filters }: { filters: ReturnFilters }) {
  const { data } = useSuspenseQuery(returnListOptions(filters));
  const [search, setSearch] = useQueryState('search', { defaultValue: '' });

  const updateMutation = useMutation({
    ...updateReturnMutation,
    onSuccess: () => toast.success('Đã cập nhật trạng thái hoàn trả'),
    onError: (e) => toast.error('Lỗi: ' + e.message)
  });

  const handleStatusChange = (id: string, newStatus: ReturnStatus) => {
    updateMutation.mutate({ id, data: { status: newStatus } });
  };

  return (
    <PageContainer>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Yêu cầu hoàn trả</h1>
          <p className='text-muted-foreground'>
            Quản lý các yêu cầu đổi trả, hoàn tiền của khách hàng
          </p>
        </div>
      </div>

      <div className='flex items-center space-x-2 mb-6'>
        <div className='relative w-full max-w-sm'>
          <Icons.search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Tìm theo sản phẩm, mã đơn...'
            className='pl-8'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className='rounded-md border bg-card'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Khách hàng / Đơn</TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Phiếu giao</TableHead>
              <TableHead>Lý do</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Ghi chú</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.returns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center h-24 text-muted-foreground'>
                  Chưa có yêu cầu hoàn trả nào
                </TableCell>
              </TableRow>
            ) : (
              data.returns.map((ret) => (
                <TableRow key={ret.id}>
                  <TableCell>
                    <div className='font-medium'>{ret.lineItem.order.customer.name}</div>
                    <div className='text-xs text-muted-foreground'>
                      {ret.lineItem.order.orderNumber}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      <div className='h-8 w-8 bg-muted rounded overflow-hidden'>
                        {ret.lineItem.historicalImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={ret.lineItem.historicalImageUrl}
                            alt='img'
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <Icons.media className='w-4 h-4 m-2 text-muted-foreground/50' />
                        )}
                      </div>
                      <div>
                        <div
                          className='font-medium text-sm truncate max-w-[200px]'
                          title={ret.lineItem.historicalName}
                        >
                          {ret.lineItem.historicalName}
                        </div>
                        <div className='text-xs text-muted-foreground'>
                          SL trả: <span className='font-semibold text-red-600'>{ret.quantity}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className='text-sm font-medium'>
                    {ret.deliveryItem.delivery.deliveryCode}
                  </TableCell>
                  <TableCell className='text-sm'>{REASON_MAP[ret.reason]}</TableCell>
                  <TableCell>
                    <Select
                      value={ret.status}
                      onValueChange={(val: ReturnStatus) => handleStatusChange(ret.id, val)}
                      disabled={updateMutation.isPending}
                    >
                      <SelectTrigger className='h-8 w-[140px] text-xs'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value='REQUESTED'>Yêu cầu</SelectItem>
                        <SelectItem value='APPROVED'>Đã duyệt</SelectItem>
                        <SelectItem value='REJECTED'>Từ chối</SelectItem>
                        <SelectItem value='RECEIVED_VN'>Đã nhận kho VN</SelectItem>
                        <SelectItem value='REFUNDED'>Đã hoàn tiền</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <div className='text-xs max-w-[150px] truncate' title={ret.note || ''}>
                      {ret.note || '-'}
                    </div>
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
