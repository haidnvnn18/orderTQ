'use client';

import { useState } from 'react';
import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { toast } from 'sonner';

import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';

import { chinaPOByIdOptions } from '../api/queries';
import { updateChinaPOStatusMutation } from '../api/mutations';

const PO_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Đang soạn' },
  { value: 'SENT', label: 'Đã gửi xưởng' },
  { value: 'CONFIRMED', label: 'Xưởng xác nhận' },
  { value: 'PRODUCING', label: 'Đang sản xuất' },
  { value: 'READY', label: 'Hàng xong' },
  { value: 'SHIPPED', label: 'Đã gửi về VN' },
  { value: 'COMPLETED', label: 'Hoàn tất' }
];

export function PODetailPage({ poId }: { poId: string }) {
  const { data } = useSuspenseQuery(chinaPOByIdOptions(poId));
  const po = data.po;

  const [status, setStatus] = useState(po.status);
  const [trackingNumber, setTrackingNumber] = useState(po.trackingNumber || '');

  const { mutate, isPending } = useMutation({
    ...updateChinaPOStatusMutation,
    onSuccess: (...args) => {
      if (updateChinaPOStatusMutation.onSuccess) {
        (updateChinaPOStatusMutation.onSuccess as any)(...args);
      }
      toast.success('Cập nhật đơn đặt hàng thành công');
    },
    onError: (error) => {
      toast.error('Cập nhật thất bại: ' + error.message);
    }
  });

  if (!po) return <div>Không tìm thấy đơn đặt hàng</div>;

  const handleUpdate = () => {
    mutate({
      id: poId,
      data: {
        status,
        trackingNumber: trackingNumber || null
      }
    });
  };

  return (
    <PageContainer>
      <div className='flex items-center gap-2 mb-6 text-sm text-muted-foreground'>
        <Link href='/dashboard/china-po' className='hover:text-primary transition-colors'>
          Đặt hàng TQ
        </Link>
        <Icons.chevronRight className='h-4 w-4' />
        <span className='text-foreground font-medium'>{po.poNumber}</span>
      </div>

      <div className='flex items-start justify-between mb-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>{po.poNumber}</h2>
          <p className='text-muted-foreground mt-1'>
            Nhà cung cấp: <span className='font-medium text-foreground'>{po.supplier?.name}</span>
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        <div className='md:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Danh sách sản phẩm ({po.poLineItems.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='border rounded-md divide-y'>
                <div className='flex items-center gap-4 p-3 bg-muted/10 font-medium text-sm'>
                  <div className='flex-1'>Sản phẩm</div>
                  <div className='w-20 text-right'>Mã khách</div>
                  <div className='w-16 text-right'>SL</div>
                  <div className='w-24 text-right'>Đơn giá</div>
                  <div className='w-24 text-right'>Thành tiền</div>
                </div>
                {po.poLineItems.map((item: any) => (
                  <div key={item.id} className='flex items-center gap-4 p-3 text-sm'>
                    <div className='flex-1'>
                      <div className='font-medium line-clamp-1'>{item.lineItem.historicalName}</div>
                      <div className='text-xs text-muted-foreground'>
                        {item.lineItem.historicalSku}
                      </div>
                    </div>
                    <div className='w-20 text-right'>
                      <Link
                        href={`/dashboard/order/${item.lineItem.orderId}`}
                        className='text-blue-600 hover:underline'
                        target='_blank'
                      >
                        {item.lineItem.order.orderNumber}
                      </Link>
                    </div>
                    <div className='w-16 text-right'>{item.quantity}</div>
                    <div className='w-24 text-right'>¥{Number(item.unitPriceCny).toFixed(2)}</div>
                    <div className='w-24 text-right font-medium text-amber-600'>
                      ¥{(Number(item.unitPriceCny) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className='flex justify-end mt-4'>
                <div className='text-right'>
                  <span className='text-muted-foreground mr-4'>Tổng tiền thanh toán:</span>
                  <span className='text-2xl font-bold text-amber-600'>
                    ¥{Number(po.totalAmountCny).toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {po.note && (
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base'>Ghi chú gửi xưởng</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm'>{po.note}</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className='space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle>Cập nhật trạng thái</CardTitle>
              <CardDescription>
                Cập nhật tiến độ xưởng và mã vận đơn để khách theo dõi.
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Trạng thái đơn PO</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PO_STATUS_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className='text-xs text-muted-foreground mt-1'>
                  Đổi trạng thái PO sẽ tự động đồng bộ sang trạng thái của các sản phẩm bên VN tương
                  ứng.
                </p>
              </div>

              <div className='space-y-2 pt-2'>
                <Label>Mã vận đơn TQ (Tracking)</Label>
                <Input
                  placeholder='Nhập mã vận đơn nội địa TQ...'
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                />
              </div>

              <Button className='w-full mt-4' onClick={handleUpdate} disabled={isPending}>
                {isPending && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
                Lưu thay đổi
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}
