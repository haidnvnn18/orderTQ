'use client';

import { useState } from 'react';
import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

import { suppliersQueryOptions } from '../api/queries';
import {
  createSupplierMutation,
  updateSupplierMutation,
  deleteSupplierMutation
} from '../api/mutations';

export function SupplierListPage() {
  const { data } = useSuspenseQuery(suppliersQueryOptions());
  const suppliers = data.suppliers;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any | null>(null);

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Nhà cung cấp (Xưởng TQ)</h2>
          <p className='text-muted-foreground'>
            Quản lý danh sách nhà cung cấp / nhà máy / xưởng sản xuất bên Trung Quốc.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Icons.add className='mr-2 h-4 w-4' />
              Thêm nhà cung cấp
            </Button>
          </DialogTrigger>
          <SupplierFormDialog onClose={() => setIsCreateOpen(false)} />
        </Dialog>
      </div>

      {suppliers.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center h-64 text-muted-foreground'>
            <Icons.user className='h-12 w-12 mb-4' />
            <p>Chưa có nhà cung cấp nào. Bấm &quot;Thêm nhà cung cấp&quot; để bắt đầu.</p>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {suppliers.map((supplier: any) => (
            <SupplierCard
              key={supplier.id}
              supplier={supplier}
              onEdit={() => setEditingSupplier(supplier)}
            />
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      {editingSupplier && (
        <Dialog open={!!editingSupplier} onOpenChange={(open) => !open && setEditingSupplier(null)}>
          <SupplierFormDialog supplier={editingSupplier} onClose={() => setEditingSupplier(null)} />
        </Dialog>
      )}
    </div>
  );
}

function SupplierCard({ supplier, onEdit }: { supplier: any; onEdit: () => void }) {
  const { mutate: deleteMutate, isPending: isDeleting } = useMutation({
    ...deleteSupplierMutation,
    onSuccess: (...args) => {
      if (deleteSupplierMutation.onSuccess) (deleteSupplierMutation.onSuccess as any)(...args);
      toast.success('Đã xóa nhà cung cấp');
    },
    onError: (error) => toast.error(error.message)
  });

  return (
    <Card className='hover:border-primary/50 transition-colors'>
      <CardHeader className='pb-3'>
        <div className='flex items-start justify-between'>
          <div>
            <CardTitle className='text-lg'>{supplier.name}</CardTitle>
            <CardDescription className='mt-1'>
              {supplier._count?.products || 0} sản phẩm · {supplier._count?.chinaPOs || 0} PO
            </CardDescription>
          </div>
          <Badge
            variant='outline'
            className={
              supplier.reliabilityScore >= 80
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : supplier.reliabilityScore >= 50
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-red-50 text-red-700 border-red-200'
            }
          >
            {supplier.reliabilityScore}%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='space-y-3'>
        {supplier.platformUrl && (
          <div className='text-sm'>
            <span className='text-muted-foreground'>Link:</span>{' '}
            <a
              href={supplier.platformUrl}
              target='_blank'
              rel='noopener noreferrer'
              className='text-blue-600 hover:underline truncate block'
            >
              {supplier.platformUrl}
            </a>
          </div>
        )}
        {supplier.contactInfo && (
          <div className='text-sm'>
            <span className='text-muted-foreground'>Liên hệ:</span>{' '}
            <span>{supplier.contactInfo}</span>
          </div>
        )}

        <div className='flex items-center gap-2 pt-2'>
          <Button variant='outline' size='sm' className='flex-1' onClick={onEdit}>
            <Icons.edit className='mr-1 h-3 w-3' />
            Sửa
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='text-destructive hover:text-destructive'
                disabled={isDeleting}
              >
                <Icons.trash className='h-3 w-3' />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Xóa nhà cung cấp?</AlertDialogTitle>
                <AlertDialogDescription>
                  Bạn có chắc chắn muốn xóa <strong>{supplier.name}</strong>? Các sản phẩm liên kết
                  sẽ bị gỡ nhà cung cấp.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Hủy</AlertDialogCancel>
                <AlertDialogAction onClick={() => deleteMutate(supplier.id)}>Xóa</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

function SupplierFormDialog({ supplier, onClose }: { supplier?: any; onClose: () => void }) {
  const isEdit = !!supplier;
  const [name, setName] = useState(supplier?.name ?? '');
  const [platformUrl, setPlatformUrl] = useState(supplier?.platformUrl ?? '');
  const [contactInfo, setContactInfo] = useState(supplier?.contactInfo ?? '');
  const [reliabilityScore, setReliabilityScore] = useState<number>(
    supplier?.reliabilityScore ?? 100
  );

  const { mutate: createMutate, isPending: isCreating } = useMutation({
    ...createSupplierMutation,
    onSuccess: (...args) => {
      if (createSupplierMutation.onSuccess) (createSupplierMutation.onSuccess as any)(...args);
      toast.success('Thêm nhà cung cấp thành công!');
      onClose();
    },
    onError: (error) => toast.error('Lỗi: ' + error.message)
  });

  const { mutate: updateMutate, isPending: isUpdating } = useMutation({
    ...updateSupplierMutation,
    onSuccess: (...args) => {
      if (updateSupplierMutation.onSuccess) (updateSupplierMutation.onSuccess as any)(...args);
      toast.success('Cập nhật thành công!');
      onClose();
    },
    onError: (error) => toast.error('Lỗi: ' + error.message)
  });

  const isPending = isCreating || isUpdating;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Tên nhà cung cấp không được để trống');
      return;
    }

    const payload = {
      name: name.trim(),
      platformUrl: platformUrl.trim() || null,
      contactInfo: contactInfo.trim() || null,
      reliabilityScore
    };

    if (isEdit) {
      updateMutate({ id: supplier.id, data: payload });
    } else {
      createMutate(payload);
    }
  };

  return (
    <DialogContent>
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Sửa nhà cung cấp' : 'Thêm nhà cung cấp mới'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Cập nhật thông tin nhà cung cấp / xưởng TQ.'
              : 'Thêm nhà cung cấp / xưởng mới từ Trung Quốc.'}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4 py-4'>
          <div className='grid gap-2'>
            <Label htmlFor='name'>Tên nhà cung cấp *</Label>
            <Input
              id='name'
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='VD: Xưởng Quảng Châu A'
              required
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='platformUrl'>Link sàn (1688 / Taobao)</Label>
            <Input
              id='platformUrl'
              value={platformUrl}
              onChange={(e) => setPlatformUrl(e.target.value)}
              placeholder='https://shop.1688.com/...'
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='contactInfo'>Thông tin liên hệ (WeChat / Zalo)</Label>
            <Textarea
              id='contactInfo'
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              placeholder='VD: WeChat: xuongA_123, Zalo: 0912...'
              rows={2}
            />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='reliabilityScore'>Độ tin cậy (0-100)</Label>
            <Input
              id='reliabilityScore'
              type='number'
              min={0}
              max={100}
              value={reliabilityScore}
              onChange={(e) => setReliabilityScore(Number(e.target.value))}
            />
            <p className='text-xs text-muted-foreground'>
              Đánh giá uy tín giao hàng. 100 = tốt nhất, 0 = kém nhất.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button type='button' variant='outline' onClick={onClose} disabled={isPending}>
            Hủy
          </Button>
          <Button type='submit' disabled={isPending}>
            {isPending && <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />}
            {isEdit ? 'Cập nhật' : 'Thêm mới'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
