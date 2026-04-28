'use client';

import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { OrderSummary } from '../../api/types';
import { ColumnDef, Column } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

// ============================================================
// Helpers
// ============================================================

const ORDER_STATUS_MAP: Record<
  string,
  { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  DRAFT: { label: 'Nháp', variant: 'secondary' },
  DEPOSITED: { label: 'Đã cọc', variant: 'default' },
  PURCHASED: { label: 'Đã mua TQ', variant: 'default' },
  WAREHOUSE_CN: { label: 'Kho TQ', variant: 'outline' },
  WAREHOUSE_VN: { label: 'Kho VN', variant: 'outline' },
  DELIVERING: { label: 'Đang giao', variant: 'default' },
  COMPLETED: { label: 'Hoàn thành', variant: 'default' },
  CANCELLED: { label: 'Đã hủy', variant: 'destructive' }
};

const FINANCIAL_STATUS_MAP: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'Chưa cọc', className: 'text-yellow-600 bg-yellow-50' },
  PARTIALLY_PAID: { label: 'Một phần', className: 'text-blue-600 bg-blue-50' },
  PAID: { label: 'Đã thanh toán', className: 'text-emerald-600 bg-emerald-50' },
  REFUNDED: { label: 'Hoàn tiền', className: 'text-rose-600 bg-rose-50' }
};

function formatVnd(amount: number | { toNumber: () => number }) {
  const num = typeof amount === 'number' ? amount : amount.toNumber();
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(num);
}

// ============================================================
// Column Definitions
// ============================================================

export const columns: ColumnDef<OrderSummary>[] = [
  {
    id: 'orderNumber',
    accessorKey: 'orderNumber',
    header: ({ column }: { column: Column<OrderSummary, unknown> }) => (
      <DataTableColumnHeader column={column} title='Mã đơn' />
    ),
    cell: ({ cell }) => (
      <div className='font-mono font-semibold text-sm'>{cell.getValue<string>()}</div>
    ),
    meta: {
      label: 'Tìm kiếm',
      placeholder: 'Mã đơn, tên, SĐT...',
      variant: 'text',
      icon: Icons.search
    },
    enableColumnFilter: true
  },
  {
    id: 'customer',
    header: 'KHÁCH HÀNG',
    cell: ({ row }) => {
      const customer = row.original.customer;
      return (
        <div>
          <div className='font-medium'>{customer.name}</div>
          <div className='text-muted-foreground text-xs'>{customer.phone}</div>
        </div>
      );
    }
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'TRẠNG THÁI',
    cell: ({ cell }) => {
      const status = cell.getValue<string>();
      const map = ORDER_STATUS_MAP[status] ?? { label: status, variant: 'secondary' as const };
      return <Badge variant={map.variant}>{map.label}</Badge>;
    }
  },
  {
    id: 'financialStatus',
    accessorKey: 'financialStatus',
    header: 'THANH TOÁN',
    cell: ({ cell }) => {
      const fs = cell.getValue<string>();
      const map = FINANCIAL_STATUS_MAP[fs] ?? { label: fs, className: '' };
      return (
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${map.className}`}>
          {map.label}
        </span>
      );
    }
  },
  {
    id: 'totalAmountVnd',
    accessorKey: 'totalAmountVnd',
    header: ({ column }: { column: Column<OrderSummary, unknown> }) => (
      <DataTableColumnHeader column={column} title='TỔNG TIỀN' />
    ),
    cell: ({ row }) => (
      <div className='text-right'>
        <div className='font-semibold'>{formatVnd(row.original.totalAmountVnd as any)}</div>
        <div className='text-muted-foreground text-xs'>
          Đã trả: {formatVnd(row.original.paidAmountVnd as any)}
        </div>
      </div>
    )
  },
  {
    id: '_count',
    header: 'SỐ SẢN PHẨM',
    cell: ({ row }) => (
      <div className='text-center'>
        <span className='rounded-full bg-muted px-2 py-0.5 text-xs font-medium'>
          {row.original._count.lineItems} SKU
        </span>
      </div>
    )
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<OrderSummary, unknown> }) => (
      <DataTableColumnHeader column={column} title='NGÀY TẠO' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<Date>();
      if (!date) return '—';
      return (
        <div className='text-sm'>{new Intl.DateTimeFormat('vi-VN').format(new Date(date))}</div>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
