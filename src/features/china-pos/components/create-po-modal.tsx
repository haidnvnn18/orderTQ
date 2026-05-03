'use client';

import { useState, useEffect, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';

import { createChinaPOMutation } from '../api/mutations';

interface CreatePOModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  supplierId: string;
  supplierName: string;
  items: any[];
  onSuccess?: () => void;
}

export function CreatePOModal({
  open,
  onOpenChange,
  supplierId,
  supplierName,
  items,
  onSuccess
}: CreatePOModalProps) {
  // State for unit prices (indexed by item id)
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [note, setNote] = useState('');

  // Initialize prices when modal opens
  useEffect(() => {
    if (open) {
      const initialPrices: Record<string, number> = {};
      items.forEach((item) => {
        initialPrices[item.id] = Number(item.historicalPriceCny);
      });
      setPrices(initialPrices);
      setNote('');
    }
  }, [open, items]);

  const totalAmountCny = useMemo(() => {
    return items.reduce((sum, item) => {
      const price = prices[item.id] || 0;
      return sum + price * item.quantity;
    }, 0);
  }, [items, prices]);

  const { mutate, isPending } = useMutation({
    ...createChinaPOMutation,
    onSuccess: (...args) => {
      if (createChinaPOMutation.onSuccess) {
        (createChinaPOMutation.onSuccess as any)(...args);
      }
      toast.success('Tạo mã đặt hàng thành công!');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => {
      toast.error('Lỗi khi tạo PO: ' + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    // Server sẽ tự động resolve supplier từ SKU nếu supplierId = 'unknown'

    const payloadItems = items.map((item) => ({
      lineItemId: item.id,
      quantity: item.quantity,
      unitPriceCny: prices[item.id] || 0
    }));

    mutate({
      supplierId,
      totalAmountCny,
      note,
      items: payloadItems
    });
  };

  const handlePriceChange = (id: string, val: string) => {
    const num = parseFloat(val);
    setPrices((prev) => ({ ...prev, [id]: isNaN(num) ? 0 : num }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-3xl max-h-[90vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>Tạo Mã Đặt Hàng (PO)</DialogTitle>
          <DialogDescription>
            Kiểm tra lại danh sách sản phẩm và giá nhập thực tế trước khi đặt hàng từ {supplierName}
            .
          </DialogDescription>
        </DialogHeader>

        <div className='flex-1 overflow-y-auto py-4'>
          <form id='create-po-form' onSubmit={handleSubmit} className='space-y-6'>
            <div className='space-y-4'>
              <h4 className='text-sm font-medium'>Danh sách sản phẩm ({items.length})</h4>
              <div className='border rounded-md divide-y'>
                {items.map((item) => (
                  <div key={item.id} className='flex items-center gap-4 p-3 text-sm'>
                    <div className='flex-1'>
                      <div className='font-medium line-clamp-1'>{item.historicalName}</div>
                      <div className='text-xs text-muted-foreground'>{item.historicalSku}</div>
                    </div>
                    <div className='w-16 text-right'>x{item.quantity}</div>
                    <div className='w-32 flex items-center gap-2'>
                      <span className='text-muted-foreground'>¥</span>
                      <Input
                        type='number'
                        step='0.01'
                        min='0'
                        className='h-8 text-right'
                        value={prices[item.id] !== undefined ? prices[item.id] : ''}
                        onChange={(e) => handlePriceChange(item.id, e.target.value)}
                        required
                      />
                    </div>
                    <div className='w-24 text-right font-medium text-amber-600'>
                      ¥{((prices[item.id] || 0) * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='note'>Ghi chú gửi xưởng (Tùy chọn)</Label>
              <Textarea
                id='note'
                placeholder='Ví dụ: Đóng gói cẩn thận...'
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>

            <div className='flex justify-between items-center p-4 bg-muted/30 rounded-lg'>
              <span className='font-medium'>Tổng tiền đặt hàng:</span>
              <span className='text-xl font-bold text-amber-600'>¥{totalAmountCny.toFixed(2)}</span>
            </div>
          </form>
        </div>

        <DialogFooter>
          <Button
            variant='outline'
            type='button'
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Hủy
          </Button>
          <Button type='submit' form='create-po-form' disabled={isPending || items.length === 0}>
            {isPending && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
            Xác nhận tạo mã PO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
