'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

import { pickerLineItemsOptions } from '../api/queries';
import { addItemsToBatchMutation } from '../api/mutations';

interface LineItemPickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
}

export function LineItemPickerModal({ open, onOpenChange, batchId }: LineItemPickerModalProps) {
  const { data: items = [], isLoading } = useQuery({
    ...pickerLineItemsOptions(),
    enabled: open
  });

  const [search, setSearch] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [poFilter, setPoFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Tìm kiếm text chung
      const matchSearch =
        search === '' ||
        item.historicalName.toLowerCase().includes(search.toLowerCase()) ||
        item.historicalSku.toLowerCase().includes(search.toLowerCase());

      // Lọc theo Nhà cung cấp
      const matchSupplier =
        supplierFilter === '' ||
        item.chinaPoLineItem?.chinaPo.supplier?.name
          .toLowerCase()
          .includes(supplierFilter.toLowerCase());

      // Lọc theo PO
      const matchPo =
        poFilter === '' ||
        item.chinaPoLineItem?.chinaPo.poNumber.toLowerCase().includes(poFilter.toLowerCase());

      return matchSearch && matchSupplier && matchPo;
    });
  }, [items, search, supplierFilter, poFilter]);

  const addMutation = useMutation({
    ...addItemsToBatchMutation,
    onSuccess: () => {
      toast.success('Đã thêm sản phẩm vào kiện');
      setSelectedIds(new Set());
      onOpenChange(false);
    },
    onError: (e) => toast.error('Lỗi thêm sản phẩm: ' + e.message)
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredItems.map((i) => i.id)));
    }
  };

  const handleAdd = () => {
    if (selectedIds.size === 0) return;
    addMutation.mutate({ batchId, data: { lineItemIds: Array.from(selectedIds) } });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-4xl max-h-[90vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>Thêm sản phẩm vào kiện hàng</DialogTitle>
          <DialogDescription>
            Chọn các sản phẩm đã sẵn sàng ở kho TQ để cho vào kiện này.
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-3 gap-2 mt-2'>
          <Input
            placeholder='Tìm Tên SP, SKU...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Input
            placeholder='Lọc theo Tên xưởng...'
            value={supplierFilter}
            onChange={(e) => setSupplierFilter(e.target.value)}
          />
          <Input
            placeholder='Lọc theo mã PO (VD: PO-2026...)'
            value={poFilter}
            onChange={(e) => setPoFilter(e.target.value)}
          />
        </div>

        <div className='flex-1 overflow-y-auto mt-4 border rounded-md'>
          {isLoading ? (
            <div className='flex justify-center items-center h-32'>
              <Icons.spinner className='w-6 h-6 animate-spin text-muted-foreground' />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className='flex justify-center items-center h-32 text-muted-foreground'>
              Không tìm thấy sản phẩm nào phù hợp.
            </div>
          ) : (
            <div className='divide-y'>
              {filteredItems.map((item) => (
                <div key={item.id} className='flex items-center gap-4 p-3 hover:bg-muted/30'>
                  <Checkbox
                    checked={selectedIds.has(item.id)}
                    onCheckedChange={() => toggleSelect(item.id)}
                  />

                  <div className='h-10 w-10 shrink-0 bg-muted rounded-md overflow-hidden flex items-center justify-center'>
                    {item.historicalImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.historicalImageUrl}
                        alt='img'
                        className='w-full h-full object-cover'
                      />
                    ) : (
                      <Icons.media className='w-5 h-5 text-muted-foreground/50' />
                    )}
                  </div>

                  <div className='flex-1 min-w-0'>
                    <div className='font-medium text-sm truncate'>{item.historicalName}</div>
                    <div className='text-xs text-muted-foreground'>
                      SKU: {item.historicalSku} | Đơn VN: {item.order.orderNumber}
                    </div>
                  </div>

                  <div className='flex flex-col items-end text-xs'>
                    <div className='font-medium text-slate-700 dark:text-slate-300'>
                      Xưởng: {item.chinaPoLineItem?.chinaPo.supplier?.name || '---'}
                    </div>
                    <div className='text-muted-foreground'>
                      PO: {item.chinaPoLineItem?.chinaPo.poNumber || '---'}
                    </div>
                  </div>

                  <div className='text-right w-16'>
                    <div className='text-sm font-semibold'>SL: {item.quantity}</div>
                    <Badge variant='outline' className='text-[10px]'>
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className='flex justify-between items-center mt-4'>
          <div className='flex items-center space-x-2'>
            <Checkbox
              id='select-all'
              checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
              onCheckedChange={toggleSelectAll}
            />
            <label
              htmlFor='select-all'
              className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer'
            >
              Chọn tất cả {filteredItems.length} kết quả
            </label>
          </div>
          <div className='text-sm text-muted-foreground'>
            Đã chọn: <span className='font-bold text-foreground'>{selectedIds.size}</span> sản phẩm
          </div>
        </div>

        <DialogFooter className='mt-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={handleAdd} disabled={selectedIds.size === 0 || addMutation.isPending}>
            {addMutation.isPending && <Icons.spinner className='w-4 h-4 mr-2 animate-spin' />}
            Thêm vào kiện
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
