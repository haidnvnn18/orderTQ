'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useUser } from '@clerk/nextjs';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';

import { addPaymentMutation } from '../api/mutations';

interface PaymentModalProps {
  orderId: string;
  remainingAmount: number;
}

export function PaymentModal({ orderId, remainingAmount }: PaymentModalProps) {
  const { user } = useUser();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<number>(remainingAmount);
  const [method, setMethod] = useState<string>('cash');
  const [note, setNote] = useState<string>('');

  const { mutate, isPending } = useMutation({
    ...addPaymentMutation,
    onSuccess: (...args) => {
      if (addPaymentMutation.onSuccess) {
        (addPaymentMutation.onSuccess as any)(...args);
      }
      toast.success('Ghi nhận thanh toán thành công');
      setOpen(false);
    },
    onError: (error) => {
      toast.error('Lỗi khi ghi nhận thanh toán: ' + error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      toast.error('Số tiền thanh toán phải lớn hơn 0');
      return;
    }

    mutate({
      id: orderId,
      data: {
        amountVnd: amount,
        method,
        note,
        changedByName: user?.fullName || 'System'
      }
    });
  };

  // Cập nhật lại số tiền gợi ý khi mở modal
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      setAmount(remainingAmount);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size='sm' variant='outline' className='w-full mt-3'>
          <Icons.add className='mr-2 h-4 w-4' />
          Ghi nhận thanh toán
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Ghi nhận thanh toán</DialogTitle>
            <DialogDescription>
              Nhập số tiền khách hàng đã thanh toán cho đơn hàng này.
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='amount'>Số tiền (VND)</Label>
              <Input
                id='amount'
                type='number'
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                min={0}
                required
              />
              <p className='text-xs text-muted-foreground'>
                Gợi ý số tiền còn thiếu: {new Intl.NumberFormat('vi-VN').format(remainingAmount)} đ
              </p>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='method'>Phương thức</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue placeholder='Chọn phương thức' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='cash'>Tiền mặt</SelectItem>
                  <SelectItem value='bank_transfer'>Chuyển khoản</SelectItem>
                  <SelectItem value='momo'>Momo / Ví điện tử</SelectItem>
                  <SelectItem value='other'>Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-2'>
              <Label htmlFor='note'>Ghi chú</Label>
              <Textarea
                id='note'
                placeholder='Ví dụ: Chuyển khoản Vietcombank'
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Hủy
            </Button>
            <Button type='submit' disabled={isPending}>
              {isPending && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
              Lưu thanh toán
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
