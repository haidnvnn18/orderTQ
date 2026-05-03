'use client';

import { useState } from 'react';
import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { deliveryDetailOptions } from '../api/queries';
import { updateDeliveryMutation, removeDeliveryItemMutation } from '../api/mutations';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { DeliveryItemPickerModal } from './delivery-item-picker-modal';
import { CreateReturnModal } from '@/features/returns/components/create-return-modal';
import type { DeliveryStatus } from '@prisma/client';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PACKING: { label: 'Đang đóng gói', color: 'bg-slate-500' },
  SHIPPED: { label: 'Đang giao hàng', color: 'bg-blue-500' },
  DELIVERED: { label: 'Giao thành công', color: 'bg-green-500' },
  RETURNED: { label: 'Bị hoàn trả', color: 'bg-red-500' }
};

export function DeliveryDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { data } = useSuspenseQuery(deliveryDetailOptions(id));
  const delivery = data?.delivery;

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [returnItemTarget, setReturnItemTarget] = useState<{
    id: string;
    lineItemId: string;
    quantity: number;
  } | null>(null);
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  const [metrics, setMetrics] = useState({
    shippingUnit: delivery?.shippingUnit || '',
    trackingNumber: delivery?.trackingNumber || '',
    shippingFee: Number(delivery?.shippingFee) || 0,
    note: delivery?.note || ''
  });

  const updateMutation = useMutation({
    ...updateDeliveryMutation,
    onSuccess: () => {
      toast.success('Đã cập nhật phiếu giao hàng');
      setIsEditingMetrics(false);
    },
    onError: (e) => toast.error('Lỗi cập nhật: ' + e.message)
  });

  const removeMutation = useMutation({
    ...removeDeliveryItemMutation,
    onSuccess: () => toast.success('Đã xóa SP khỏi phiếu'),
    onError: (e) => toast.error('Lỗi xóa: ' + e.message)
  });

  if (!delivery) {
    return <PageContainer>Không tìm thấy phiếu giao hàng</PageContainer>;
  }

  const handleStatusChange = (newStatus: DeliveryStatus) => {
    updateMutation.mutate({ id, data: { status: newStatus } });
  };

  const handleSaveMetrics = () => {
    updateMutation.mutate({
      id,
      data: {
        shippingUnit: metrics.shippingUnit,
        trackingNumber: metrics.trackingNumber,
        shippingFee: Number(metrics.shippingFee),
        note: metrics.note
      }
    });
  };

  return (
    <PageContainer>
      <div className='flex items-center gap-4 mb-6'>
        <Button variant='ghost' size='icon' onClick={() => router.push('/dashboard/delivery')}>
          <Icons.chevronLeft className='h-4 w-4' />
        </Button>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold tracking-tight'>{delivery.deliveryCode}</h1>
            <Badge className={`${STATUS_MAP[delivery.status]?.color} text-white`}>
              {STATUS_MAP[delivery.status]?.label}
            </Badge>
          </div>
          <p className='text-sm text-muted-foreground mt-1'>
            Đơn hàng: <span className='font-semibold'>{delivery.order.orderNumber}</span> - Khách:{' '}
            <span className='font-semibold'>{delivery.order.customer.name}</span>
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Cột trái: Thông tin kiện */}
        <div className='md:col-span-1 space-y-6'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg flex justify-between items-center'>
                Trạng thái giao hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={delivery.status}
                onValueChange={handleStatusChange}
                disabled={updateMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='PACKING'>Đang đóng gói (PACKING)</SelectItem>
                  <SelectItem value='SHIPPED'>Đang giao hàng (SHIPPED)</SelectItem>
                  <SelectItem value='DELIVERED'>Giao thành công (DELIVERED)</SelectItem>
                  <SelectItem value='RETURNED'>Hoàn trả (RETURNED)</SelectItem>
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground mt-2'>
                Khi đổi sang "Đang giao", đơn gốc sẽ chuyển sang Đang giao. Khi "Thành công", số
                lượng SP sẽ được cộng vào hệ thống.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3 flex flex-row items-center justify-between'>
              <CardTitle className='text-lg'>Thông tin Vận chuyển</CardTitle>
              {!isEditingMetrics && (
                <Button variant='ghost' size='sm' onClick={() => setIsEditingMetrics(true)}>
                  <Icons.edit className='h-4 w-4' />
                </Button>
              )}
            </CardHeader>
            <CardContent className='space-y-4'>
              {isEditingMetrics ? (
                <>
                  <div className='grid gap-2'>
                    <Label>Đơn vị vận chuyển</Label>
                    <Input
                      value={metrics.shippingUnit}
                      onChange={(e) => setMetrics({ ...metrics, shippingUnit: e.target.value })}
                      placeholder='Viettel Post, GHTK...'
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label>Mã vận đơn (Bill)</Label>
                    <Input
                      value={metrics.trackingNumber}
                      onChange={(e) => setMetrics({ ...metrics, trackingNumber: e.target.value })}
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label>Phí ship nội địa VN (VNĐ)</Label>
                    <Input
                      type='number'
                      value={metrics.shippingFee}
                      onChange={(e) =>
                        setMetrics({ ...metrics, shippingFee: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label>Ghi chú</Label>
                    <Textarea
                      value={metrics.note}
                      onChange={(e) => setMetrics({ ...metrics, note: e.target.value })}
                    />
                  </div>
                  <div className='flex gap-2 justify-end mt-4'>
                    <Button variant='outline' size='sm' onClick={() => setIsEditingMetrics(false)}>
                      Hủy
                    </Button>
                    <Button
                      size='sm'
                      onClick={handleSaveMetrics}
                      disabled={updateMutation.isPending}
                    >
                      Lưu
                    </Button>
                  </div>
                </>
              ) : (
                <dl className='grid grid-cols-2 gap-x-4 gap-y-4 text-sm'>
                  <div className='col-span-2'>
                    <dt className='text-muted-foreground'>Đơn vị vận chuyển</dt>
                    <dd className='font-medium'>{delivery.shippingUnit || '-'}</dd>
                  </div>
                  <div className='col-span-2'>
                    <dt className='text-muted-foreground'>Mã vận đơn</dt>
                    <dd className='font-medium'>{delivery.trackingNumber || '-'}</dd>
                  </div>
                  <div className='col-span-2'>
                    <dt className='text-muted-foreground'>Phí vận chuyển</dt>
                    <dd className='font-medium text-amber-600'>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(Number(delivery.shippingFee))}
                    </dd>
                  </div>
                  <div className='col-span-2'>
                    <dt className='text-muted-foreground'>Địa chỉ khách</dt>
                    <dd className='font-medium'>
                      {delivery.order.customer.address || 'Chưa cập nhật'}
                    </dd>
                  </div>
                  <div className='col-span-2'>
                    <dt className='text-muted-foreground'>Ghi chú</dt>
                    <dd className='font-medium italic'>{delivery.note || '-'}</dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cột phải: Danh sách Delivery Items */}
        <div className='md:col-span-2 space-y-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2 border-b'>
              <CardTitle className='text-lg'>
                Sản phẩm gửi đi ({delivery.deliveryItems.length})
              </CardTitle>
              {(delivery.status === 'PACKING' || delivery.status === 'SHIPPED') && (
                <Button size='sm' onClick={() => setIsPickerOpen(true)}>
                  <Icons.add className='w-4 h-4 mr-2' />
                  Thêm sản phẩm
                </Button>
              )}
            </CardHeader>
            <CardContent className='p-0'>
              {delivery.deliveryItems.length === 0 ? (
                <div className='p-8 text-center text-muted-foreground'>
                  Chưa có sản phẩm nào trong phiếu giao này.
                </div>
              ) : (
                <div className='divide-y'>
                  {delivery.deliveryItems.map((item) => (
                    <div key={item.id} className='flex items-center gap-4 p-4 hover:bg-muted/30'>
                      {/* Ảnh */}
                      <div className='h-12 w-12 shrink-0 bg-muted rounded-md overflow-hidden flex items-center justify-center'>
                        {item.lineItem.historicalImageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.lineItem.historicalImageUrl}
                            alt='img'
                            className='w-full h-full object-cover'
                          />
                        ) : (
                          <Icons.media className='w-6 h-6 text-muted-foreground/50' />
                        )}
                      </div>

                      {/* Info */}
                      <div className='flex-1 min-w-0'>
                        <div className='font-medium truncate text-sm'>
                          {item.lineItem.historicalName}
                        </div>
                        <div className='text-xs text-muted-foreground mt-0.5'>
                          SKU: {item.lineItem.historicalSku}
                        </div>
                      </div>

                      {/* Qty */}
                      <div className='text-right'>
                        <div className='text-sm font-semibold'>Giao: {item.quantity}</div>
                        <div className='text-xs text-muted-foreground'>
                          Tổng đặt: {item.lineItem.quantity}
                        </div>
                      </div>

                      {/* Actions */}
                      {delivery.status === 'PACKING' && (
                        <div className='w-8 shrink-0 ml-2'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='text-red-500 hover:text-red-600'
                            onClick={() => {
                              if (confirm('Xóa sản phẩm khỏi phiếu giao?')) {
                                removeMutation.mutate(item.id);
                              }
                            }}
                            disabled={removeMutation.isPending}
                          >
                            <Icons.trash className='w-4 h-4' />
                          </Button>
                        </div>
                      )}
                      {(delivery.status === 'DELIVERED' || delivery.status === 'RETURNED') && (
                        <div className='w-auto shrink-0 ml-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() =>
                              setReturnItemTarget({
                                id: item.id,
                                lineItemId: item.lineItemId,
                                quantity: item.quantity
                              })
                            }
                          >
                            Hoàn trả
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DeliveryItemPickerModal
        open={isPickerOpen}
        onOpenChange={setIsPickerOpen}
        deliveryId={id}
        orderId={delivery.orderId}
      />

      {returnItemTarget && (
        <CreateReturnModal
          open={!!returnItemTarget}
          onOpenChange={(open) => !open && setReturnItemTarget(null)}
          deliveryItemId={returnItemTarget.id}
          lineItemId={returnItemTarget.lineItemId}
          maxQuantity={returnItemTarget.quantity}
        />
      )}
    </PageContainer>
  );
}
