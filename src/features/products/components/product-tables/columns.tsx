'use client';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';
import type { ProductListItem } from '../../api/types';
import { Column, ColumnDef } from '@tanstack/react-table';
import { Icons } from '@/components/icons';
import Image from 'next/image';
import { CellAction } from './cell-action';

export const columns: ColumnDef<ProductListItem>[] = [
  {
    accessorKey: 'images',
    header: 'ẢNH',
    cell: ({ row }) => {
      const images = row.getValue('images') as string[];
      const firstImage = Array.isArray(images) && images.length > 0 ? images[0] : null;

      return (
        <div className='relative aspect-square h-12 w-12'>
          {firstImage ? (
            <Image
              src={firstImage}
              alt={row.original.title}
              fill
              sizes='48px'
              className='rounded-lg object-cover'
            />
          ) : (
            <div className='flex h-full w-full items-center justify-center rounded-lg bg-muted'>
              <Icons.product className='h-5 w-5 text-muted-foreground' />
            </div>
          )}
        </div>
      );
    }
  },
  {
    id: 'title',
    accessorKey: 'title',
    header: ({ column }: { column: Column<ProductListItem, unknown> }) => (
      <DataTableColumnHeader column={column} title='Tên sản phẩm' />
    ),
    cell: ({ cell }) => <div className='font-medium'>{cell.getValue<string>()}</div>,
    meta: {
      label: 'Tên',
      placeholder: 'Tìm sản phẩm...',
      variant: 'text',
      icon: Icons.text
    },
    enableColumnFilter: true
  },
  {
    accessorKey: 'basePriceCny',
    header: 'GIÁ TỆ (¥)',
    cell: ({ row }) => {
      const price = Number(row.getValue('basePriceCny'));
      return <div className='font-mono'>¥{price.toFixed(2)}</div>;
    }
  },
  {
    id: 'supplier',
    accessorFn: (row) => row.supplier?.name ?? '—',
    header: 'NHÀ CUNG CẤP',
    cell: ({ cell }) => <div className='text-muted-foreground'>{cell.getValue<string>()}</div>
  },
  {
    id: 'variants',
    accessorFn: (row) => row._count.variants,
    header: 'SỐ SKU',
    cell: ({ cell }) => <Badge variant='secondary'>{cell.getValue<number>()} SKU</Badge>
  },
  {
    id: 'isActive',
    accessorKey: 'isActive',
    header: 'TRẠNG THÁI',
    cell: ({ row }) => {
      const active = row.getValue('isActive') as boolean;
      return (
        <Badge variant={active ? 'default' : 'destructive'}>
          {active ? 'Đang bán' : 'Ngừng bán'}
        </Badge>
      );
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
