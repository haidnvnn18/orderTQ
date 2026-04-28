'use client';

// ============================================================
// OrderDetailPage — Trang chi tiết đơn hàng
// Bao gồm: Thông tin đơn, Line Items, Timeline trạng thái, Thanh toán
// ============================================================

import { useQuery, useMutation } from '@tanstack/react-query';
import { notFound } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';

import { orderByIdOptions } from '../api/queries';
import { updateOrderStatusMutation } from '../api/mutations';
import type { OrderDetail, LineItemDetail, StatusLogDetail } from '../api/types';
import Image from 'next/image';

// ============================================================
// Constants
// ============================================================
const ORDER_STATUSES = [
  { value: 'DRAFT', label: 'Nháp' },
  { value: 'DEPOSITED', label: 'Đã cọc' },
  { value: 'PURCHASED', label: 'Đã mua TQ' },
  { value: 'WAREHOUSE_CN', label: 'Kho TQ' },
  { value: 'WAREHOUSE_VN', label: 'Kho VN' },
  { value: 'DELIVERING', label: 'Đang giao' },
  { value: 'COMPLETED', label: 'Hoàn thành' },
  { value: 'CANCELLED', label: 'Đã hủy' }
];

const LINE_ITEM_STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Chờ đặt', color: 'bg-gray-100 text-gray-600' },
  ORDERED: { label: 'Đã đặt TQ', color: 'bg-blue-100 text-blue-700' },
  PRODUCING: { label: 'Đang sx', color: 'bg-yellow-100 text-yellow-700' },
  READY_CN: { label: 'Sẵn kho TQ', color: 'bg-orange-100 text-orange-700' },
  IN_TRANSIT: { label: 'Vận chuyển', color: 'bg-purple-100 text-purple-700' },
  ARRIVED_VN: { label: 'Kho VN', color: 'bg-teal-100 text-teal-700' },
  DELIVERED: { label: 'Đã giao', color: 'bg-emerald-100 text-emerald-700' }
};

// ============================================================
// Helpers
// ============================================================
function formatVnd(amount: number | { toNumber: () => number }) {
  const num = typeof amount === 'number' ? amount : amount.toNumber();
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(num);
}

function formatCny(amount: number | { toNumber: () => number }) {
  const num = typeof amount === 'number' ? amount : amount.toNumber();
  return `¥${num.toFixed(2)}`;
}

function formatDate(date: Date | string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
}

// ============================================================
// Sub-components
// ============================================================

function LineItemRow({ item }: { item: LineItemDetail }) {
  const statusInfo = LINE_ITEM_STATUS_MAP[item.status] ?? {
    label: item.status,
    color: 'bg-gray-100 text-gray-600'
  };

  return (
    <div className='flex items-center gap-3 rounded-lg border p-3'>
      {/* Ảnh */}
      <div className='h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted'>
        {item.historicalImageUrl ? (
          <Image
            src={item.historicalImageUrl}
            alt={item.historicalSku}
            width={48}
            height={48}
            className='h-full w-full object-cover'
            unoptimized
          />
        ) : (
          <div className='flex h-full w-full items-center justify-center text-muted-foreground'>
            <Icons.product className='h-5 w-5' />
          </div>
        )}
      </div>

      {/* Info */}
      <div className='min-w-0 flex-1'>
        <div className='truncate font-medium text-sm'>{item.historicalName}</div>
        <div className='font-mono text-xs text-muted-foreground'>{item.historicalSku}</div>
        <div className='mt-0.5 text-xs text-muted-foreground'>
          {formatCny(item.historicalPriceCny as any)} = {formatVnd(item.historicalPriceVnd as any)}{' '}
          × {item.quantity}
        </div>
      </div>

      {/* Status */}
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
        {statusInfo.label}
      </span>

      {/* Fulfilled */}
      <div className='text-right text-xs'>
        <div className='text-muted-foreground'>Giao</div>
        <div className='font-semibold'>
          {item.fulfilledQuantity}/{item.quantity}
        </div>
      </div>

      {/* Thành tiền */}
      <div className='text-right text-sm font-semibold w-24'>
        {formatVnd(
          (typeof item.historicalPriceVnd === 'number'
            ? item.historicalPriceVnd
            : (item.historicalPriceVnd as any).toNumber()) * item.quantity
        )}
      </div>
    </div>
  );
}

function StatusTimeline({ logs }: { logs: StatusLogDetail[] }) {
  return (
    <div className='space-y-3'>
      {logs.map((log, idx) => (
        <div key={log.id} className='flex gap-3'>
          <div className='flex flex-col items-center'>
            <div
              className={`h-2.5 w-2.5 rounded-full border-2 mt-1 ${idx === 0 ? 'border-primary bg-primary' : 'border-muted-foreground bg-background'}`}
            />
            {idx < logs.length - 1 && <div className='w-px flex-1 bg-border mt-1' />}
          </div>
          <div className='pb-3'>
            <div className='flex items-center gap-2 text-sm'>
              <span className='font-medium'>{log.newStatus}</span>
              {log.oldStatus && (
                <span className='text-muted-foreground text-xs'>(từ {log.oldStatus})</span>
              )}
            </div>
            {log.note && <div className='mt-0.5 text-xs text-muted-foreground'>{log.note}</div>}
            <div className='mt-0.5 text-xs text-muted-foreground'>
              {log.changedByName && `${log.changedByName} · `}
              {formatDate(log.createdAt)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Update Status Panel
// ============================================================
function UpdateStatusPanel({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [newStatus, setNewStatus] = useState('');
  const [note, setNote] = useState('');

  const mutation = useMutation({
    ...updateOrderStatusMutation,
    onSuccess: () => {
      toast.success('Đã cập nhật trạng thái đơn hàng');
      setNote('');
      setNewStatus('');
    },
    onError: (err: any) => {
      toast.error(`Lỗi: ${err.message}`);
    }
  });

  const handleUpdate = () => {
    if (!newStatus) {
      toast.error('Vui lòng chọn trạng thái mới');
      return;
    }
    mutation.mutate({ id: orderId, data: { status: newStatus, note: note || null } });
  };

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-base'>Cập nhật trạng thái</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div>
          <Label>Trạng thái mới</Label>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger className='mt-1'>
              <SelectValue placeholder='Chọn trạng thái...' />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUSES.filter((s) => s.value !== currentStatus).map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Ghi chú (tuỳ chọn)</Label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder='Lý do thay đổi trạng thái...'
            rows={2}
            className='mt-1'
          />
        </div>
        <Button
          className='w-full'
          onClick={handleUpdate}
          disabled={mutation.isPending || !newStatus}
        >
          {mutation.isPending ? (
            <>
              <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              Đang cập nhật...
            </>
          ) : (
            'Cập nhật trạng thái'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Main Component
// ============================================================
export default function OrderDetailPage({ orderId }: { orderId: string }) {
  const { data, isLoading, isError } = useQuery({
    ...orderByIdOptions(orderId),
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always'
  });

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <Icons.spinner className='mr-2 h-6 w-6 animate-spin' />
        <span>Đang tải thông tin đơn hàng...</span>
      </div>
    );
  }

  if (isError || !data?.order) {
    notFound();
  }

  const order: OrderDetail = data.order;
  const totalPaid =
    typeof order.paidAmountVnd === 'number'
      ? order.paidAmountVnd
      : (order.paidAmountVnd as any).toNumber();
  const totalAmount =
    typeof order.totalAmountVnd === 'number'
      ? order.totalAmountVnd
      : (order.totalAmountVnd as any).toNumber();
  const remaining = totalAmount - totalPaid;

  return (
    <div className='space-y-6'>
      {/* ── Header ── */}
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <div className='flex items-center gap-3'>
            <h2 className='text-2xl font-bold'>{order.orderNumber}</h2>
            <Badge>{order.status}</Badge>
            <Badge variant='outline'>{order.financialStatus}</Badge>
          </div>
          <div className='text-muted-foreground text-sm mt-1'>
            Tạo lúc {formatDate(order.createdAt)}
          </div>
        </div>
        <Button variant='outline' asChild>
          <Link href='/dashboard/order'>
            <Icons.arrowLeft className='mr-2 h-4 w-4' />
            Quay lại danh sách
          </Link>
        </Button>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        {/* ── Cột trái (2/3) ── */}
        <div className='space-y-6 lg:col-span-2'>
          {/* Thông tin khách hàng */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center gap-2'>
                <Icons.user className='h-4 w-4' />
                Khách hàng
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-start justify-between'>
                <div>
                  <div className='font-semibold text-base'>{order.customer.name}</div>
                  <div className='text-muted-foreground text-sm'>{order.customer.phone}</div>
                  {order.customer.email && (
                    <div className='text-muted-foreground text-sm'>{order.customer.email}</div>
                  )}
                  {order.customer.address && (
                    <div className='text-muted-foreground text-sm mt-1'>
                      {order.customer.address}
                    </div>
                  )}
                </div>
                <Badge variant='outline'>{order.customer.depositRate}% cọc</Badge>
              </div>
              {order.customerNote && (
                <div className='mt-3 rounded-md bg-muted/50 p-2 text-sm text-muted-foreground'>
                  💬 {order.customerNote}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Danh sách sản phẩm */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center gap-2'>
                <Icons.product className='h-4 w-4' />
                Sản phẩm ({order.lineItems.length} SKU)
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {order.lineItems.map((item) => (
                <LineItemRow key={item.id} item={item} />
              ))}

              <Separator />
              <div className='space-y-1.5 text-sm'>
                <div className='flex justify-between'>
                  <span className='text-muted-foreground'>Tỷ giá</span>
                  <span>
                    {formatCny(1)} = {formatVnd(order.exchangeRate as any)}
                  </span>
                </div>
                {(order.shippingFeeVnd as any) > 0 && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Phí vận chuyển</span>
                    <span>{formatVnd(order.shippingFeeVnd as any)}</span>
                  </div>
                )}
                {(order.serviceFeeVnd as any) > 0 && (
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Phí dịch vụ</span>
                    <span>{formatVnd(order.serviceFeeVnd as any)}</span>
                  </div>
                )}
                <Separator />
                <div className='flex justify-between font-semibold text-base'>
                  <span>Tổng đơn hàng</span>
                  <span className='text-primary'>{formatVnd(order.totalAmountVnd as any)}</span>
                </div>
                <div className='flex justify-between text-muted-foreground'>
                  <span>Đã thanh toán</span>
                  <span className='text-emerald-600 font-medium'>
                    {formatVnd(order.paidAmountVnd as any)}
                  </span>
                </div>
                {remaining > 0 && (
                  <div className='flex justify-between text-muted-foreground'>
                    <span>Còn lại</span>
                    <span className='text-rose-600 font-medium'>{formatVnd(remaining)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Ghi chú */}
          {order.internalNote && (
            <Card>
              <CardHeader className='pb-3'>
                <CardTitle className='text-base'>Ghi chú nội bộ</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground'>{order.internalNote}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Cột phải (1/3) ── */}
        <div className='space-y-6'>
          {/* Cập nhật trạng thái */}
          <UpdateStatusPanel orderId={order.id} currentStatus={order.status} />

          {/* Timeline */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center gap-2'>
                <Icons.clock className='h-4 w-4' />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.statusLogs.length > 0 ? (
                <StatusTimeline logs={order.statusLogs} />
              ) : (
                <p className='text-muted-foreground text-sm'>Chưa có lịch sử thay đổi</p>
              )}
            </CardContent>
          </Card>

          {/* Thanh toán */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base flex items-center gap-2'>
                <Icons.billing className='h-4 w-4' />
                Lịch sử thanh toán
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.payments.length === 0 ? (
                <p className='text-muted-foreground text-sm'>Chưa có thanh toán nào</p>
              ) : (
                <div className='space-y-2'>
                  {order.payments.map((payment) => (
                    <div
                      key={payment.id}
                      className='flex items-center justify-between text-sm rounded-md border p-2'
                    >
                      <div>
                        <div className='font-medium'>{formatVnd(payment.amountVnd as any)}</div>
                        <div className='text-xs text-muted-foreground'>
                          {payment.method} · {formatDate(payment.paidAt)}
                        </div>
                        {payment.note && (
                          <div className='text-xs text-muted-foreground'>{payment.note}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
