'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { CustomerSummary } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import { CellAction } from './cell-action';

export const columns: ColumnDef<CustomerSummary>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: ({ column }: { column: Column<CustomerSummary, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tên khách hàng' />
    ),
    cell: ({ cell }) => <div className='font-medium'>{cell.getValue<string>()}</div>,
    meta: {
      label: 'Tìm kiếm',
      placeholder: 'Tìm tên, SĐT...',
      variant: 'text',
      icon: Icons.search
    },
    enableColumnFilter: true
  },
  {
    id: 'phone',
    accessorKey: 'phone',
    header: 'SỐ ĐIỆN THOẠI',
    cell: ({ cell }) => <div>{cell.getValue<string>()}</div>
  },
  {
    id: 'tags',
    accessorKey: 'tags',
    header: 'PHÂN LOẠI',
    cell: ({ cell }) => {
      const tags = cell.getValue<string[]>();
      if (!tags?.length) return <div className='text-muted-foreground'>—</div>;
      return (
        <div className='flex flex-wrap gap-1'>
          {tags.map((tag, idx) => (
            <Badge key={idx} variant='secondary'>
              {tag}
            </Badge>
          ))}
        </div>
      );
    }
  },
  {
    id: 'depositRate',
    accessorKey: 'depositRate',
    header: '% CỌC',
    cell: ({ cell }) => (
      <div className='font-medium text-emerald-600'>{cell.getValue<number>()}%</div>
    )
  },
  {
    id: 'createdAt',
    accessorKey: 'createdAt',
    header: ({ column }: { column: Column<CustomerSummary, unknown> }) => (
      <DataTableColumnHeader column={column} title='NGÀY TẠO' />
    ),
    cell: ({ cell }) => {
      const date = cell.getValue<Date>();
      if (!date) return '—';
      return <div>{new Intl.DateTimeFormat('vi-VN').format(new Date(date))}</div>;
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
