'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import { deliveryPickerOptions } from '../api/queries';
import { addDeliveryItemsMutation } from '../api/mutations';

interface DeliveryItemPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryId: string;
  orderId: string;
}

export function DeliveryItemPickerModal({
  open,
  onOpenChange,
  deliveryId,
  orderId
}: DeliveryItemPickerModalProps) {
  const { data: items = [], isLoading } = useQuery({
    ...deliveryPickerOptions(orderId),
    enabled: open && !!orderId
  });

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const addMutation = useMutation({
    ...addDeliveryItemsMutation,
    onSuccess: () => {
      toast.success('Đã thêm sản phẩm vào phiếu giao');
      setSelectedIds(new Set());
      setQuantities({});
      onOpenChange(false);
    },
    onError: (e) => toast.error('Lỗi thêm sản phẩm: ' + e.message)
  });

  const toggleSelect = (id: string, remaining: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
      const newQty = { ...quantities };
      delete newQty[id];
      setQuantities(newQty);
    } else {
      next.add(id);
      setQuantities({ ...quantities, [id]: remaining }); // Mặc định giao hết số lượng còn lại
    }
    setSelectedIds(next);
  };

  const handleQuantityChange = (id: string, val: string, max: number) => {
    let num = parseInt(val, 10);
    if (isNaN(num) || num < 1) num = 1;
    if (num > max) num = max;
    setQuantities({ ...quantities, [id]: num });
    if (!selectedIds.has(id)) {
      setSelectedIds(new Set(selectedIds).add(id));
    }
  };

  const handleAdd = () => {
    if (selectedIds.size === 0) return;
    const itemsToAdd = Array.from(selectedIds).map((id) => ({
      lineItemId: id,
      quantity: quantities[id] || 1
    }));
    addMutation.mutate({ id: deliveryId, data: { items: itemsToAdd } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>Thêm sản phẩm giao hàng</DialogTitle>
          <DialogDescription>
            Chỉ hiển thị các sản phẩm thuộc đơn hàng này, đã về tới Việt Nam và chưa giao hết.
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto mt-4 border rounded-md'>
          {isLoading ? (
            <div className='flex justify-center items-center h-32'>
              <Icons.spinner className='w-6 h-6 animate-spin text-muted-foreground' />
            </div>
          ) : items.length === 0 ? (
            <div className='flex justify-center items-center h-32 text-muted-foreground'>
              Không có sản phẩm nào hợp lệ để giao. (Tất cả đã giao hoặc chưa về tới kho VN)
            </div>
          ) : (
            <div className='divide-y'>
              {items.map((item) => (
                <div key={item.id} className='flex items-center gap-4 p-3 hover:bg-muted/30'>
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={() => toggleSelect(item.id, item.remainingQuantity)}
                  />

                  <div className='h-10 w-10 shrink-0 bg-muted rounded-md overflow-hidden flex items-center justify-center'>
                    {item.historicalImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.historicalImageUrl}
                        alt='img'
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <Icons.media className='w-5 h-5 text-muted-foreground/50' />
                    )}
                  </div>

                  <div className='flex-1 min-w-0'>
                    <div className='font-medium text-sm truncate'>{item.historicalName}</div>
                    <div className='text-xs text-muted-foreground'>SKU: {item.historicalSku}</div>
                  </div>

                  <div className='flex flex-col items-end text-xs w-32'>
                    <div className='text-muted-foreground'>Tổng đặt: {item.quantity}</div>
                    <div className='text-green-600'>Đã giao: {item.fulfilledQuantity}</div>
                    <div className='font-medium text-amber-600 mt-1'>
                      Còn lại: {item.remainingQuantity}
                    </div>
                  </div>

                  <div className='w-24'>
                    <Input
                      type='number'
                      min={1}
                      max={item.remainingQuantity}
                      value={quantities[item.id] || ''}
                      onChange={(e) =>
                        handleQuantityChange(item.id, e.target.value, item.remainingQuantity)
                      }
                      placeholder='SL giao'
                      disabled={!selectedIds.has(item.id)}
                      className='h-8'
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className='mt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleAdd} disabled={selectedIds.size === 0 || addMutation.isPending}>
            {addMutation.isPending && <Icons.spinner className='w-4 h-4 mr-2 animate-spin' />}
            Thêm vào phiếu giao ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
