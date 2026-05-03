'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { chinaPOsQueryOptions } from '../api/queries';

const PO_STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Đang soạn', color: 'bg-gray-100 text-gray-700' },
  SENT: { label: 'Đã gửi xưởng', color: 'bg-blue-100 text-blue-700' },
  CONFIRMED: { label: 'Xưởng xác nhận', color: 'bg-indigo-100 text-indigo-700' },
  PRODUCING: { label: 'Đang sản xuất', color: 'bg-yellow-100 text-yellow-700' },
  READY: { label: 'Hàng xong', color: 'bg-orange-100 text-orange-700' },
  SHIPPED: { label: 'Đã gửi về VN', color: 'bg-purple-100 text-purple-700' },
  COMPLETED: { label: 'Hoàn tất', color: 'bg-emerald-100 text-emerald-700' }
};

export function POListing() {
  // Tạm thời fix cứng page 1, limit 20 để đơn giản hóa. Có thể tích hợp nuqs sau
  const { data } = useSuspenseQuery(chinaPOsQueryOptions({ page: 1, limit: 20 }));

  if (data.totalPOs === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center h-64 text-muted-foreground'>
          <p>Chưa có Đơn đặt hàng (PO) nào.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Mã PO</TableHead>
            <TableHead>Ngày tạo</TableHead>
            <TableHead>Nhà cung cấp</TableHead>
            <TableHead className='text-right'>Số lượng mặt hàng</TableHead>
            <TableHead className='text-right'>Tổng tiền (CNY)</TableHead>
            <TableHead>Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.pos.map((po: any) => {
            const statusInfo = PO_STATUS_MAP[po.status] || {
              label: po.status,
              color: 'bg-gray-100'
            };

            return (
              <TableRow key={po.id}>
                <TableCell className='font-medium'>
                  <Link
                    href={`/dashboard/china-po/${po.id}`}
                    className='text-blue-600 hover:underline'
                  >
                    {po.poNumber}
                  </Link>
                </TableCell>
                <TableCell>{new Date(po.createdAt).toLocaleDateString('vi-VN')}</TableCell>
                <TableCell>{po.supplier?.name || 'Không rõ'}</TableCell>
                <TableCell className='text-right'>{po._count?.poLineItems || 0}</TableCell>
                <TableCell className='text-right text-amber-600 font-medium'>
                  ¥{Number(po.totalAmountCny).toFixed(2)}
                </TableCell>
                <TableCell>
                  <Badge variant='outline' className={statusInfo.color}>
                    {statusInfo.label}
                  </Badge>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
