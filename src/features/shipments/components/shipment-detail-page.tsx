'use client';

import { useState } from 'react';
import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { shipmentDetailOptions } from '../api/queries';
import { updateShipmentBatchMutation, removeBatchItemMutation } from '../api/mutations';

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

import { LineItemPickerModal } from './line-item-picker-modal';
import type { BatchStatus } from '@prisma/client';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PACKING: { label: 'Đang gom hàng', color: 'bg-slate-500' },
  IN_TRANSIT: { label: 'Đang vận chuyển (TQ -> VN)', color: 'bg-blue-500' },
  ARRIVED_VN: { label: 'Đã về kho VN', color: 'bg-orange-500' },
  DISTRIBUTED: { label: 'Đã phân phối', color: 'bg-green-500' }
};

export function ShipmentDetailPage({ id }: { id: string }) {
  const router = useRouter();
  const { data } = useSuspenseQuery(shipmentDetailOptions(id));
  const batch = data?.batch;

  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isEditingMetrics, setIsEditingMetrics] = useState(false);
  const [metrics, setMetrics] = useState({
    totalWeightKg: batch?.totalWeightKg || 0,
    totalVolumeM3: batch?.totalVolumeM3 || 0,
    shippingFeeTotal: batch?.shippingFeeTotal || 0,
    cnTrackingNumber: batch?.cnTrackingNumber || '',
    vnTrackingNumber: batch?.vnTrackingNumber || '',
    notes: batch?.notes || ''
  });

  const updateMutation = useMutation({
    ...updateShipmentBatchMutation,
    onSuccess: () => {
      toast.success('Đã cập nhật kiện hàng');
      setIsEditingMetrics(false);
    },
    onError: (e) => toast.error('Lỗi cập nhật: ' + e.message)
  });

  const removeMutation = useMutation({
    ...removeBatchItemMutation,
    onSuccess: () => toast.success('Đã xóa SP khỏi kiện'),
    onError: (e) => toast.error('Lỗi xóa: ' + e.message)
  });

  if (!batch) {
    return <PageContainer>Không tìm thấy kiện hàng</PageContainer>;
  }

  const handleStatusChange = (newStatus: BatchStatus) => {
    updateMutation.mutate({ id, data: { status: newStatus } });
  };

  const handleSaveMetrics = () => {
    updateMutation.mutate({
      id,
      data: {
        totalWeightKg: Number(metrics.totalWeightKg),
        totalVolumeM3: Number(metrics.totalVolumeM3),
        shippingFeeTotal: Number(metrics.shippingFeeTotal),
        cnTrackingNumber: metrics.cnTrackingNumber,
        vnTrackingNumber: metrics.vnTrackingNumber,
        notes: metrics.notes
      }
    });
  };

  return (
    <PageContainer>
      <div className='flex items-center gap-4 mb-6'>
        <Button variant='ghost' size='icon' onClick={() => router.push('/dashboard/shipment')}>
          <Icons.chevronLeft className='h-4 w-4' />
        </Button>
        <div>
          <div className='flex items-center gap-3'>
            <h1 className='text-2xl font-bold tracking-tight'>{batch.batchCode}</h1>
            <Badge className={`${STATUS_MAP[batch.status]?.color} text-white`}>
              {STATUS_MAP[batch.status]?.label}
            </Badge>
          </div>
          <p className='text-sm text-muted-foreground mt-1'>
            Ngày tạo: {format(new Date(batch.createdAt), 'dd/MM/yyyy HH:mm')}
          </p>
        </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* Cột trái: Thông tin kiện */}
        <div className='md:col-span-1 space-y-6'>
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-lg flex justify-between items-center'>
                Trạng thái kiện
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={batch.status}
                onValueChange={handleStatusChange}
                disabled={updateMutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='PACKING'>Đang gom hàng (PACKING)</SelectItem>
                  <SelectItem value='IN_TRANSIT'>Đang vận chuyển (IN_TRANSIT)</SelectItem>
                  <SelectItem value='ARRIVED_VN'>Đã về kho VN (ARRIVED_VN)</SelectItem>
                  <SelectItem value='DISTRIBUTED'>Đã phân phối (DISTRIBUTED)</SelectItem>
                </SelectContent>
              </Select>
              <p className='text-xs text-muted-foreground mt-2'>
                Khi đổi sang "Đang vận chuyển" hoặc "Về kho VN", hệ thống sẽ tự động cập nhật trạng
                thái các sản phẩm bên trong.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className='pb-3 flex flex-row items-center justify-between'>
              <CardTitle className='text-lg'>Thông số vận chuyển</CardTitle>
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
                    <Label>Mã VĐ nội địa TQ</Label>
                    <Input
                      value={metrics.cnTrackingNumber}
                      onChange={(e) => setMetrics({ ...metrics, cnTrackingNumber: e.target.value })}
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label>Mã VĐ Việt Nam</Label>
                    <Input
                      value={metrics.vnTrackingNumber}
                      onChange={(e) => setMetrics({ ...metrics, vnTrackingNumber: e.target.value })}
                    />
                  </div>
                  <div className='grid grid-cols-2 gap-4'>
                    <div className='grid gap-2'>
                      <Label>Cân nặng (kg)</Label>
                      <Input
                        type='number'
                        step='0.01'
                        value={metrics.totalWeightKg}
                        onChange={(e) =>
                          setMetrics({ ...metrics, totalWeightKg: Number(e.target.value) })
                        }
                      />
                    </div>
                    <div className='grid gap-2'>
                      <Label>Thể tích (m³)</Label>
                      <Input
                        type='number'
                        step='0.001'
                        value={metrics.totalVolumeM3}
                        onChange={(e) =>
                          setMetrics({ ...metrics, totalVolumeM3: Number(e.target.value) })
                        }
                      />
                    </div>
                  </div>
                  <div className='grid gap-2'>
                    <Label>Tổng phí ship (VNĐ)</Label>
                    <Input
                      type='number'
                      value={metrics.shippingFeeTotal}
                      onChange={(e) =>
                        setMetrics({ ...metrics, shippingFeeTotal: Number(e.target.value) })
                      }
                    />
                  </div>
                  <div className='grid gap-2'>
                    <Label>Ghi chú</Label>
                    <Textarea
                      value={metrics.notes}
                      onChange={(e) => setMetrics({ ...metrics, notes: e.target.value })}
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
                  <div>
                    <dt className='text-muted-foreground'>Mã TQ</dt>
                    <dd className='font-medium'>{batch.cnTrackingNumber || '-'}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Mã VN</dt>
                    <dd className='font-medium'>{batch.vnTrackingNumber || '-'}</dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Cân nặng</dt>
                    <dd className='font-medium'>
                      {batch.totalWeightKg ? `${batch.totalWeightKg} kg` : '-'}
                    </dd>
                  </div>
                  <div>
                    <dt className='text-muted-foreground'>Thể tích</dt>
                    <dd className='font-medium'>
                      {batch.totalVolumeM3 ? `${batch.totalVolumeM3} m³` : '-'}
                    </dd>
                  </div>
                  <div className='col-span-2'>
                    <dt className='text-muted-foreground'>Phí ship</dt>
                    <dd className='font-medium text-amber-600'>
                      {new Intl.NumberFormat('vi-VN', {
                        style: 'currency',
                        currency: 'VND'
                      }).format(batch.shippingFeeTotal)}
                    </dd>
                  </div>
                  <div className='col-span-2'>
                    <dt className='text-muted-foreground'>Ghi chú</dt>
                    <dd className='font-medium italic'>{batch.notes || '-'}</dd>
                  </div>
                </dl>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cột phải: Danh sách LineItems */}
        <div className='md:col-span-2 space-y-6'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between pb-2 border-b'>
              <CardTitle className='text-lg'>
                Sản phẩm trong kiện ({batch.batchItems.length})
              </CardTitle>
              {batch.status === 'PACKING' && (
                <Button size='sm' onClick={() => setIsPickerOpen(true)}>
                  <Icons.add className='w-4 h-4 mr-2' />
                  Thêm sản phẩm
                </Button>
              )}
            </CardHeader>
            <CardContent className='p-0'>
              {batch.batchItems.length === 0 ? (
                <div className='p-8 text-center text-muted-foreground'>
                  Chưa có sản phẩm nào trong kiện này.
                </div>
              ) : (
                <div className='divide-y'>
                  {batch.batchItems.map((item) => (
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
                          SKU: {item.lineItem.historicalSku} | Đơn:{' '}
                          <span className='text-foreground font-medium'>
                            {item.lineItem.order.orderNumber}
                          </span>
                          {item.lineItem.order.customer &&
                            ` (${item.lineItem.order.customer.name})`}
                        </div>
                      </div>

                      {/* Qty */}
                      <div className='text-right'>
                        <div className='text-sm font-semibold'>x{item.expectedQuantity}</div>
                        <Badge variant='outline' className='text-[10px] mt-1'>
                          {item.lineItem.status}
                        </Badge>
                      </div>

                      {/* Actions */}
                      {batch.status === 'PACKING' && (
                        <div className='w-8 shrink-0'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='text-red-500 hover:text-red-600'
                            onClick={() => {
                              if (confirm('Xóa sản phẩm khỏi kiện?')) {
                                removeMutation.mutate(item.id);
                              }
                            }}
                            disabled={removeMutation.isPending}
                          >
                            <Icons.trash className='w-4 h-4' />
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

      <LineItemPickerModal open={isPickerOpen} onOpenChange={setIsPickerOpen} batchId={id} />
    </PageContainer>
  );
}
