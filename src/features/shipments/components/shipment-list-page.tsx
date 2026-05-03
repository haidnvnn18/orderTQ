'use client';

import { useState } from 'react';
import { useSuspenseQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useQueryState } from 'nuqs';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { shipmentListOptions } from '../api/queries';
import { createShipmentBatchMutation } from '../api/mutations';
import type { ShipmentBatchFilters } from '../api/types';

import PageContainer from '@/components/layout/page-container';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PACKING: { label: 'Đang gom hàng', color: 'bg-slate-500' },
  IN_TRANSIT: { label: 'Đang vận chuyển', color: 'bg-blue-500' },
  ARRIVED_VN: { label: 'Đã về kho VN', color: 'bg-orange-500' },
  DISTRIBUTED: { label: 'Đã phân phối', color: 'bg-green-500' }
};

export function ShipmentListPage({ filters }: { filters: ShipmentBatchFilters }) {
  const router = useRouter();
  const { data } = useSuspenseQuery(shipmentListOptions(filters));

  const [search, setSearch] = useQueryState('search', { defaultValue: '' });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCnTracking, setNewCnTracking] = useState('');

  const createMutation = useMutation({
    ...createShipmentBatchMutation,
    onSuccess: (res) => {
      if (createShipmentBatchMutation.onSuccess) {
        (createShipmentBatchMutation.onSuccess as any)();
      }
      toast.success('Đã tạo kiện hàng mới');
      setIsCreateOpen(false);
      router.push(`/dashboard/shipment/${res.id}`);
    },
    onError: (e) => toast.error('Lỗi tạo kiện hàng: ' + e.message)
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({ cnTrackingNumber: newCnTracking });
  };

  return (
    <PageContainer>
      <div className='flex justify-between items-center mb-6'>
        <div>
          <h1 className='text-2xl font-bold tracking-tight'>Kiện hàng vận chuyển</h1>
          <p className='text-muted-foreground'>
            Quản lý và theo dõi các kiện hàng gửi từ Trung Quốc về Việt Nam
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Icons.add className='w-4 h-4 mr-2' />
          Tạo kiện hàng mới
        </Button>
      </div>

      <div className='flex items-center space-x-2 mb-6'>
        <div className='relative w-full max-w-sm'>
          <Icons.search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Tìm mã kiện, mã vận đơn...'
            className='pl-8'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className='rounded-md border bg-card'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mã kiện</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead>Mã vận đơn (TQ/VN)</TableHead>
              <TableHead>Thông số</TableHead>
              <TableHead>Số SP bên trong</TableHead>
              <TableHead>Ngày tạo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.batches.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center h-24 text-muted-foreground'>
                  Chưa có kiện hàng nào
                </TableCell>
              </TableRow>
            ) : (
              data.batches.map((batch) => (
                <TableRow
                  key={batch.id}
                  className='cursor-pointer hover:bg-muted/50'
                  onClick={() => router.push(`/dashboard/shipment/${batch.id}`)}
                >
                  <TableCell className='font-medium'>{batch.batchCode}</TableCell>
                  <TableCell>
                    <Badge
                      variant='secondary'
                      className={`${STATUS_MAP[batch.status]?.color || 'bg-gray-500'} text-white`}
                    >
                      {STATUS_MAP[batch.status]?.label || batch.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className='text-sm'>
                      <div>
                        <span className='text-muted-foreground text-xs'>CN: </span>
                        {batch.cnTrackingNumber || '-'}
                      </div>
                      <div>
                        <span className='text-muted-foreground text-xs'>VN: </span>
                        {batch.vnTrackingNumber || '-'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='text-sm text-muted-foreground'>
                      {batch.totalWeightKg ? `${batch.totalWeightKg}kg` : '- kg'} /{' '}
                      {batch.totalVolumeM3 ? `${batch.totalVolumeM3}m³` : '- m³'}
                    </div>
                  </TableCell>
                  <TableCell>{batch._count.batchItems} mã</TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {format(new Date(batch.createdAt), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Tạo kiện */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo Kiện Hàng Mới</DialogTitle>
            <DialogDescription>
              Tạo kiện hàng trống để bắt đầu nhặt sản phẩm vào, hoặc nhập mã vận đơn TQ nếu xưởng
              gửi nguyên kiện.
            </DialogDescription>
          </DialogHeader>
          <form id='create-batch-form' onSubmit={handleCreate} className='space-y-4 py-4'>
            <div className='space-y-2'>
              <Label htmlFor='cnTracking'>Mã vận đơn nội địa TQ (Tùy chọn)</Label>
              <Input
                id='cnTracking'
                placeholder='Ví dụ: YT123456789'
                value={newCnTracking}
                onChange={(e) => setNewCnTracking(e.target.value)}
              />
            </div>
          </form>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsCreateOpen(false)}>
              Hủy
            </Button>
            <Button type='submit' form='create-batch-form' disabled={createMutation.isPending}>
              {createMutation.isPending && <Icons.spinner className='w-4 h-4 mr-2 animate-spin' />}
              Tạo mới
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
