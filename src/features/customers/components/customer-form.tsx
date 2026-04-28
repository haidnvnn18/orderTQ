'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createCustomerMutation, updateCustomerMutation } from '../api/mutations';
import type { CustomerDetail, CustomerMutationPayload } from '../api/types';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState } from 'react';
import { customerSchema } from '../schemas/customer';

export default function CustomerForm({
  initialData,
  pageTitle
}: {
  initialData: CustomerDetail | null;
  pageTitle: string;
}) {
  const router = useRouter();
  const isEdit = !!initialData;

  // Form state
  const [name, setName] = useState(initialData?.name ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [address, setAddress] = useState(initialData?.address ?? '');
  const [depositRate, setDepositRate] = useState<string>(
    initialData?.depositRate ? String(initialData.depositRate) : '30'
  );
  const [tags, setTags] = useState(initialData?.tags?.join(', ') ?? '');
  const [notes, setNotes] = useState(initialData?.notes ?? '');

  // Mutations
  const createMutation = useMutation({
    ...createCustomerMutation,
    onSuccess: () => {
      toast.success('Tạo khách hàng thành công!');
      router.push('/dashboard/customer');
    },
    onError: (err: any) => {
      toast.error(`Lỗi: ${err.message}`);
    }
  });

  const updateMutation = useMutation({
    ...updateCustomerMutation,
    onSuccess: () => {
      toast.success('Cập nhật khách hàng thành công!');
      router.push('/dashboard/customer');
    },
    onError: (err: any) => {
      toast.error(`Lỗi: ${err.message}`);
    }
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsedTags = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    // Validate
    const validationResult = customerSchema.safeParse({
      name,
      phone,
      email,
      address,
      depositRate: Number(depositRate),
      tags: parsedTags,
      notes
    });

    if (!validationResult.success) {
      const firstError = validationResult.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    const payload: CustomerMutationPayload = validationResult.data;

    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, values: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle>{pageTitle}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='name'>Tên khách hàng *</Label>
              <Input
                id='name'
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder='VD: Nguyễn Văn A'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='phone'>Số điện thoại *</Label>
              <Input
                id='phone'
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder='VD: 0901234567'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder='VD: email@example.com'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='depositRate'>Tỷ lệ cọc (%) *</Label>
              <Input
                id='depositRate'
                type='number'
                min='0'
                max='100'
                value={depositRate}
                onChange={(e) => setDepositRate(e.target.value)}
                placeholder='VD: 30'
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='address'>Địa chỉ</Label>
            <Input
              id='address'
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder='VD: 123 Đường ABC, Quận XYZ'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='tags'>Phân loại (Tags)</Label>
            <Input
              id='tags'
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder='Nhập các tag cách nhau bởi dấu phẩy. VD: VIP, Sỉ'
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='notes'>Ghi chú</Label>
            <Textarea
              id='notes'
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='Ghi chú thêm về khách hàng...'
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <div className='flex justify-end gap-3'>
        <Button type='button' variant='outline' onClick={() => router.back()}>
          Quay lại
        </Button>
        <Button type='submit' disabled={isPending}>
          {isPending ? 'Đang xử lý...' : isEdit ? 'Cập nhật' : 'Tạo mới'}
        </Button>
      </div>
    </form>
  );
}
