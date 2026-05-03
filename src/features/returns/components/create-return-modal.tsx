'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

import { createReturnMutation } from '@/features/returns/api/mutations';
import type { ReturnReason } from '@prisma/client';

interface CreateReturnModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryItemId: string;
  lineItemId: string;
  maxQuantity: number;
}

export function CreateReturnModal({
  open,
  onOpenChange,
  deliveryItemId,
  lineItemId,
  maxQuantity
}: CreateReturnModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<ReturnReason>('OTHER');
  const [note, setNote] = useState('');

  const createMutation = useMutation({
    ...createReturnMutation,
    onSuccess: () => {
      toast.success('Đã tạo yêu cầu hoàn trả');
      onOpenChange(false);
      setQuantity(1);
      setNote('');
    },
    onError: (e) => toast.error('Lỗi: ' + e.message)
  });

  const handleSubmit = () => {
    createMutation.mutate({
      deliveryItemId,
      lineItemId,
      quantity,
      reason,
      note
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Tạo yêu cầu hoàn trả</DialogTitle>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label>Số lượng trả (tối đa {maxQuantity})</Label>
            <Input
              type='number'
              min={1}
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
          </div>
          <div className='grid gap-2'>
            <Label>Lý do</Label>
            <Select value={reason} onValueChange={(val: ReturnReason) => setReason(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='DEFECTIVE'>Hàng lỗi</SelectItem>
                <SelectItem value='WRONG_ITEM'>Gửi nhầm SP</SelectItem>
                <SelectItem value='WRONG_SIZE'>Sai size/màu</SelectItem>
                <SelectItem value='CUSTOMER_CHANGE'>Khách đổi ý</SelectItem>
                <SelectItem value='OTHER'>Lý do khác</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className='grid gap-2'>
            <Label>Ghi chú</Label>
            <Textarea
              placeholder='Nhập ghi chú chi tiết...'
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            Tạo yêu cầu
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
