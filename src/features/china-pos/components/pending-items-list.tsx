'use client';

import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import Image from 'next/image';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';

import { pendingLineItemsQueryOptions } from '../api/queries';
import { CreatePOModal } from './create-po-modal';

export function PendingItemsList() {
  const { data } = useSuspenseQuery(pendingLineItemsQueryOptions());
  const groups = data.groups;

  if (groups.length === 0) {
    return (
      <Card>
        <CardContent className='flex flex-col items-center justify-center h-64 text-muted-foreground'>
          <Icons.check className='h-12 w-12 mb-4 text-emerald-500' />
          <p>Tuyệt vời! Hiện không có sản phẩm nào đang chờ đặt hàng.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className='space-y-6'>
      {groups.map((group) => (
        <SupplierGroupCard key={group.supplierId} group={group} />
      ))}
    </div>
  );
}

function SupplierGroupCard({ group }: { group: any }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleToggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(group.lineItems.map((i: any) => i.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) newSet.add(id);
    else newSet.delete(id);
    setSelectedIds(newSet);
  };

  const selectedItems = group.lineItems.filter((i: any) => selectedIds.has(i.id));

  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between bg-muted/30 pb-4'>
        <div>
          <CardTitle className='text-lg'>{group.supplierName}</CardTitle>
          <CardDescription>
            {group.totalItems} sản phẩm ({group.totalQuantity} chiếc) đang chờ đặt hàng
          </CardDescription>
        </div>
        <Button disabled={selectedIds.size === 0} onClick={() => setIsModalOpen(true)}>
          <Icons.send className='mr-2 h-4 w-4' />
          Tạo mã đặt hàng ({selectedIds.size})
        </Button>
      </CardHeader>
      <CardContent className='p-0'>
        <div className='divide-y'>
          {/* Header Row */}
          <div className='flex items-center gap-4 p-4 bg-muted/10 font-medium text-sm'>
            <Checkbox
              checked={selectedIds.size === group.lineItems.length && group.lineItems.length > 0}
              onCheckedChange={handleToggleSelectAll}
            />
            <div className='flex-1'>Sản phẩm</div>
            <div className='w-24 text-right'>SL</div>
            <div className='w-32 text-right'>Đơn giá (CNY)</div>
            <div className='w-32 text-right'>Mã đơn gốc</div>
          </div>

          {/* Items */}
          {group.lineItems.map((item: any) => (
            <div
              key={item.id}
              className='flex items-center gap-4 p-4 text-sm hover:bg-muted/30 transition-colors'
            >
              <Checkbox
                checked={selectedIds.has(item.id)}
                onCheckedChange={(checked) => handleToggleSelect(item.id, !!checked)}
              />
              <div className='flex flex-1 items-center gap-3'>
                <div className='h-10 w-10 shrink-0 overflow-hidden rounded-md bg-muted relative'>
                  {item.historicalImageUrl ? (
                    <Image
                      src={item.historicalImageUrl}
                      alt=''
                      fill
                      className='object-cover'
                      sizes='40px'
                    />
                  ) : (
                    <div className='flex h-full items-center justify-center text-muted-foreground'>
                      <Icons.media className='h-4 w-4' />
                    </div>
                  )}
                </div>
                <div>
                  <div className='font-medium line-clamp-1'>{item.historicalName}</div>
                  <div className='text-xs text-muted-foreground'>{item.historicalSku}</div>
                </div>
              </div>
              <div className='w-24 text-right'>{item.quantity}</div>
              <div className='w-32 text-right font-medium text-amber-600'>
                ¥{Number(item.historicalPriceCny).toFixed(2)}
              </div>
              <div className='w-32 text-right'>
                <Badge variant='outline'>{item.orderNumber}</Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>

      <CreatePOModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        supplierId={group.supplierId}
        supplierName={group.supplierName}
        items={selectedItems}
        onSuccess={() => setSelectedIds(new Set())}
      />
    </Card>
  );
}
