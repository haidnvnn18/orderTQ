'use client';

// ============================================================
// OrderForm — Tạo đơn hàng mới (Master-Detail UI)
// Giao diện: Chọn Khách hàng + Nhập tỷ giá + Chọn Sản phẩm/Variant
// ============================================================

import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { Separator } from '@/components/ui/separator';

import { createOrderMutation } from '../api/mutations';
import type { CreateLineItemPayload } from '../api/types';
import type { ProductPickerItem } from '../api/picker-service';
import { getProductsForPicker, getCustomersForPicker } from '../api/picker-service';
import { createOrderSchema } from '../schemas/order';

// ============================================================
// Types
// ============================================================
interface CartItem {
  variantId: string;
  variantSku: string;
  productTitle: string;
  attributes: Record<string, string>;
  quantity: number;
  priceCny: number;
  priceVnd: number;
  imageUrl: string | null;
}

interface CustomerOption {
  id: string;
  name: string;
  phone: string;
  depositRate: number;
}

// ============================================================
// Helper
// ============================================================
function formatVnd(amount: number) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(amount);
}

function formatCny(amount: number) {
  return `¥${amount.toFixed(2)}`;
}

function attributesToLabel(attrs: Record<string, string>) {
  return Object.entries(attrs)
    .map(([, v]) => v)
    .join(' / ');
}

// ============================================================
// Main Component
// ============================================================
export default function OrderForm() {
  const router = useRouter();

  // --- Khách hàng ---
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerOption | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // --- Tỷ giá & phí ---
  const [exchangeRate, setExchangeRate] = useState('3500');
  const [shippingFee, setShippingFee] = useState('0');
  const [serviceFee, setServiceFee] = useState('0');
  const [internalNote, setInternalNote] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  // --- Product picker ---
  const [productSearch, setProductSearch] = useState('');
  const [products, setProducts] = useState<ProductPickerItem[]>([]);
  const [showProductPanel, setShowProductPanel] = useState(false);

  // --- Giỏ hàng ---
  const [cart, setCart] = useState<CartItem[]>([]);

  const [isPending, startTransition] = useTransition();

  // --- Mutations ---
  const createMutation = useMutation({
    ...createOrderMutation,
    onSuccess: (order) => {
      toast.success(`Tạo đơn thành công! Mã: ${order.orderNumber}`);
      router.push('/dashboard/order');
    },
    onError: (err: any) => {
      toast.error(`Lỗi: ${err.message}`);
    }
  });

  // ============================================================
  // Handlers — Khách hàng
  // ============================================================
  const handleSearchCustomer = useCallback((value: string) => {
    setCustomerSearch(value);
    setShowCustomerDropdown(true);
    startTransition(async () => {
      const results = await getCustomersForPicker(value);
      setCustomerOptions(results);
    });
  }, []);

  const handleSelectCustomer = (c: CustomerOption) => {
    setSelectedCustomer(c);
    setCustomerSearch(c.name);
    setShowCustomerDropdown(false);
  };

  // ============================================================
  // Handlers — Sản phẩm
  // ============================================================
  const handleSearchProduct = useCallback((value: string) => {
    setProductSearch(value);
    startTransition(async () => {
      const results = await getProductsForPicker(value);
      setProducts(results);
    });
  }, []);

  const handleOpenProductPanel = () => {
    setShowProductPanel(true);
    startTransition(async () => {
      const results = await getProductsForPicker('');
      setProducts(results);
    });
  };

  const handleAddVariant = (
    product: ProductPickerItem,
    variant: ProductPickerItem['variants'][0]
  ) => {
    const rate = parseFloat(exchangeRate) || 3500;
    const priceVnd = variant.effectivePriceCny * rate;

    setCart((prev) => {
      const existing = prev.findIndex((i) => i.variantId === variant.id);
      if (existing !== -1) {
        return prev.map((item, idx) =>
          idx === existing ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [
        ...prev,
        {
          variantId: variant.id,
          variantSku: variant.sku,
          productTitle: product.title,
          attributes: variant.attributes,
          quantity: 1,
          priceCny: variant.effectivePriceCny,
          priceVnd,
          imageUrl: variant.variantImageUrl ?? product.images[0] ?? null
        }
      ];
    });
    toast.success(`Đã thêm: ${variant.sku}`);
  };

  const handleQtyChange = (variantId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.variantId === variantId
            ? { ...item, quantity: Math.max(1, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveItem = (variantId: string) => {
    setCart((prev) => prev.filter((item) => item.variantId !== variantId));
  };

  // ============================================================
  // Tính tổng
  // ============================================================
  const rate = parseFloat(exchangeRate) || 3500;
  const subTotalVnd = cart.reduce((s, i) => s + i.priceVnd * i.quantity, 0);
  const subTotalCny = cart.reduce((s, i) => s + i.priceCny * i.quantity, 0);
  const grandTotal = subTotalVnd + parseFloat(shippingFee || '0') + parseFloat(serviceFee || '0');
  const depositSuggested = selectedCustomer
    ? Math.ceil((grandTotal * selectedCustomer.depositRate) / 100)
    : 0;

  // ============================================================
  // Submit
  // ============================================================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomer) {
      toast.error('Vui lòng chọn khách hàng');
      return;
    }

    if (cart.length === 0) {
      toast.error('Vui lòng thêm ít nhất 1 sản phẩm vào đơn');
      return;
    }

    const lineItems: CreateLineItemPayload[] = cart.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
      historicalPriceCny: item.priceCny,
      historicalPriceVnd: item.priceVnd,
      historicalSku: item.variantSku,
      historicalName: `${item.productTitle} – ${attributesToLabel(item.attributes)}`,
      historicalImageUrl: item.imageUrl
    }));

    const payload = {
      customerId: selectedCustomer.id,
      exchangeRate: rate,
      shippingFeeVnd: parseFloat(shippingFee || '0'),
      serviceFeeVnd: parseFloat(serviceFee || '0'),
      internalNote: internalNote || null,
      customerNote: customerNote || null,
      lineItems
    };

    const validation = createOrderSchema.safeParse(payload);
    if (!validation.success) {
      toast.error(validation.error.issues[0].message);
      return;
    }

    createMutation.mutate(payload);
  };

  // ============================================================
  // Render
  // ============================================================
  return (
    <div className='space-y-6'>
      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* ── Row: Khách hàng + Tỷ giá ── */}
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          {/* Khách hàng */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>Thông tin khách hàng</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='relative'>
                <Label htmlFor='customer-search'>Tìm khách hàng *</Label>
                <Input
                  id='customer-search'
                  value={customerSearch}
                  onChange={(e) => handleSearchCustomer(e.target.value)}
                  onFocus={() => {
                    setShowCustomerDropdown(true);
                    if (customerOptions.length === 0) {
                      handleSearchCustomer('');
                    }
                  }}
                  placeholder='Tìm theo tên hoặc SĐT...'
                  className='mt-1'
                  autoComplete='off'
                />
                {showCustomerDropdown && customerOptions.length > 0 && (
                  <div className='absolute z-20 mt-1 w-full rounded-md border bg-popover shadow-lg'>
                    {customerOptions.map((c) => (
                      <button
                        key={c.id}
                        type='button'
                        onClick={() => handleSelectCustomer(c)}
                        className='flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent'
                      >
                        <span className='font-medium'>{c.name}</span>
                        <span className='text-muted-foreground'>{c.phone}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedCustomer && (
                <div className='rounded-lg border bg-muted/40 p-3 text-sm'>
                  <div className='flex items-center justify-between'>
                    <span className='font-semibold'>{selectedCustomer.name}</span>
                    <Badge variant='outline'>{selectedCustomer.depositRate}% cọc</Badge>
                  </div>
                  <div className='text-muted-foreground mt-1'>{selectedCustomer.phone}</div>
                </div>
              )}

              <div className='space-y-1'>
                <Label htmlFor='customer-note'>Yêu cầu khách hàng</Label>
                <Textarea
                  id='customer-note'
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder='VD: Giao trước Tết, đóng gói kỹ...'
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tỷ giá & Phí */}
          <Card>
            <CardHeader className='pb-3'>
              <CardTitle className='text-base'>Tỷ giá & Phí</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='space-y-1'>
                <Label htmlFor='exchange-rate'>Tỷ giá CNY/VND *</Label>
                <div className='relative'>
                  <Input
                    id='exchange-rate'
                    type='number'
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(e.target.value)}
                    placeholder='VD: 3500'
                    min='100'
                    step='10'
                  />
                  <span className='absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground'>
                    VND/¥
                  </span>
                </div>
              </div>

              <div className='grid grid-cols-2 gap-3'>
                <div className='space-y-1'>
                  <Label htmlFor='shipping-fee'>Phí vận chuyển (VND)</Label>
                  <Input
                    id='shipping-fee'
                    type='number'
                    value={shippingFee}
                    onChange={(e) => setShippingFee(e.target.value)}
                    min='0'
                    step='1000'
                  />
                </div>
                <div className='space-y-1'>
                  <Label htmlFor='service-fee'>Phí dịch vụ (VND)</Label>
                  <Input
                    id='service-fee'
                    type='number'
                    value={serviceFee}
                    onChange={(e) => setServiceFee(e.target.value)}
                    min='0'
                    step='1000'
                  />
                </div>
              </div>

              <div className='space-y-1'>
                <Label htmlFor='internal-note'>Ghi chú nội bộ</Label>
                <Textarea
                  id='internal-note'
                  value={internalNote}
                  onChange={(e) => setInternalNote(e.target.value)}
                  placeholder='Ghi chú nội bộ (khách không thấy)...'
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Giỏ hàng ── */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-3'>
            <CardTitle className='text-base'>
              Danh sách sản phẩm{' '}
              {cart.length > 0 && (
                <Badge variant='secondary' className='ml-2'>
                  {cart.length} SKU
                </Badge>
              )}
            </CardTitle>
            <Button type='button' variant='outline' size='sm' onClick={handleOpenProductPanel}>
              <Icons.add className='mr-2 h-4 w-4' />
              Thêm sản phẩm
            </Button>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className='flex flex-col items-center justify-center py-10 text-muted-foreground'>
                <Icons.product className='mb-3 h-10 w-10 opacity-30' />
                <p className='text-sm'>Chưa có sản phẩm nào. Nhấn "Thêm sản phẩm" để bắt đầu.</p>
              </div>
            ) : (
              <div className='space-y-3'>
                {cart.map((item) => (
                  <div
                    key={item.variantId}
                    className='flex items-center gap-3 rounded-lg border p-3'
                  >
                    {/* Ảnh */}
                    <div className='h-12 w-12 shrink-0 overflow-hidden rounded-md bg-muted'>
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.variantSku}
                          width={48}
                          height={48}
                          className='h-full w-full object-cover'
                          unoptimized
                        />
                      ) : (
                        <div className='flex h-full w-full items-center justify-center text-muted-foreground'>
                          <Icons.product className='h-5 w-5' />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className='min-w-0 flex-1'>
                      <div className='truncate font-medium text-sm'>{item.productTitle}</div>
                      <div className='text-muted-foreground text-xs'>
                        {item.variantSku} · {attributesToLabel(item.attributes)}
                      </div>
                      <div className='mt-0.5 text-xs'>
                        {formatCny(item.priceCny)} ={' '}
                        <span className='font-semibold text-emerald-600'>
                          {formatVnd(item.priceVnd)}
                        </span>
                      </div>
                    </div>

                    {/* Số lượng */}
                    <div className='flex items-center gap-1'>
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        className='h-7 w-7'
                        onClick={() => handleQtyChange(item.variantId, -1)}
                      >
                        <Icons.minus className='h-3 w-3' />
                      </Button>
                      <span className='w-8 text-center text-sm font-semibold'>{item.quantity}</span>
                      <Button
                        type='button'
                        variant='outline'
                        size='icon'
                        className='h-7 w-7'
                        onClick={() => handleQtyChange(item.variantId, 1)}
                      >
                        <Icons.add className='h-3 w-3' />
                      </Button>
                    </div>

                    {/* Thành tiền */}
                    <div className='text-right text-sm'>
                      <div className='font-semibold'>
                        {formatVnd(item.priceVnd * item.quantity)}
                      </div>
                    </div>

                    {/* Xóa */}
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      className='h-7 w-7 text-destructive hover:text-destructive'
                      onClick={() => handleRemoveItem(item.variantId)}
                    >
                      <Icons.trash className='h-3 w-3' />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Tổng cộng */}
            {cart.length > 0 && (
              <>
                <Separator className='my-4' />
                <div className='space-y-2 text-sm'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Tổng hàng hóa</span>
                    <span>
                      {formatCny(subTotalCny)} = {formatVnd(subTotalVnd)}
                    </span>
                  </div>
                  {parseFloat(shippingFee || '0') > 0 && (
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Phí vận chuyển</span>
                      <span>{formatVnd(parseFloat(shippingFee))}</span>
                    </div>
                  )}
                  {parseFloat(serviceFee || '0') > 0 && (
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground'>Phí dịch vụ</span>
                      <span>{formatVnd(parseFloat(serviceFee))}</span>
                    </div>
                  )}
                  <Separator />
                  <div className='flex justify-between font-semibold text-base'>
                    <span>Tổng đơn hàng</span>
                    <span className='text-primary'>{formatVnd(grandTotal)}</span>
                  </div>
                  {selectedCustomer && (
                    <div className='flex justify-between text-muted-foreground'>
                      <span>Cọc đề nghị ({selectedCustomer.depositRate}%)</span>
                      <span className='font-medium text-amber-600'>
                        {formatVnd(depositSuggested)}
                      </span>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Nút Submit ── */}
        <div className='flex justify-end gap-3'>
          <Button type='button' variant='outline' onClick={() => router.back()}>
            Quay lại
          </Button>
          <Button
            type='submit'
            disabled={createMutation.isPending || cart.length === 0 || !selectedCustomer}
          >
            {createMutation.isPending ? (
              <>
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
                Đang tạo đơn...
              </>
            ) : (
              <>
                <Icons.check className='mr-2 h-4 w-4' />
                Tạo đơn hàng
              </>
            )}
          </Button>
        </div>
      </form>

      {/* ── Product Picker Panel ── */}
      {showProductPanel && (
        <div className='fixed inset-0 z-50 flex items-end justify-end bg-black/40 sm:items-stretch'>
          <div className='flex h-full w-full flex-col bg-background shadow-xl sm:w-[480px]'>
            {/* Header */}
            <div className='flex items-center justify-between border-b px-4 py-3'>
              <h3 className='font-semibold'>Chọn sản phẩm</h3>
              <Button variant='ghost' size='icon' onClick={() => setShowProductPanel(false)}>
                <Icons.close className='h-4 w-4' />
              </Button>
            </div>

            {/* Search */}
            <div className='border-b p-3'>
              <Input
                placeholder='Tìm theo tên sản phẩm hoặc SKU...'
                value={productSearch}
                onChange={(e) => handleSearchProduct(e.target.value)}
                autoFocus
              />
            </div>

            {/* Product list */}
            <div className='flex-1 overflow-y-auto p-3 space-y-3'>
              {isPending && (
                <div className='flex justify-center py-6'>
                  <Icons.spinner className='h-5 w-5 animate-spin text-muted-foreground' />
                </div>
              )}

              {!isPending && products.length === 0 && (
                <div className='py-10 text-center text-muted-foreground text-sm'>
                  Không tìm thấy sản phẩm
                </div>
              )}

              {products.map((product) => (
                <div key={product.id} className='rounded-lg border'>
                  {/* Product header */}
                  <div className='flex items-center gap-2 border-b px-3 py-2 bg-muted/30'>
                    <div className='h-8 w-8 shrink-0 overflow-hidden rounded bg-muted'>
                      {product.images[0] ? (
                        <Image
                          src={product.images[0]}
                          alt={product.title}
                          width={32}
                          height={32}
                          className='h-full w-full object-cover'
                          unoptimized
                        />
                      ) : (
                        <div className='flex h-full w-full items-center justify-center'>
                          <Icons.product className='h-4 w-4 text-muted-foreground' />
                        </div>
                      )}
                    </div>
                    <div>
                      <div className='text-sm font-semibold'>{product.title}</div>
                      <div className='text-xs text-muted-foreground'>
                        Giá gốc: {formatCny(product.basePriceCny)}
                      </div>
                    </div>
                  </div>

                  {/* Variants */}
                  <div className='divide-y'>
                    {product.variants.map((variant) => {
                      const inCart = cart.find((i) => i.variantId === variant.id);
                      return (
                        <button
                          key={variant.id}
                          type='button'
                          onClick={() => handleAddVariant(product, variant)}
                          className='flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent transition-colors'
                        >
                          <div className='text-left'>
                            <div className='font-mono text-xs text-muted-foreground'>
                              {variant.sku}
                            </div>
                            <div className='font-medium'>
                              {attributesToLabel(variant.attributes) || 'Mặc định'}
                            </div>
                          </div>
                          <div className='flex items-center gap-2'>
                            <span className='text-emerald-600 font-semibold'>
                              {formatCny(variant.effectivePriceCny)}
                            </span>
                            {inCart ? (
                              <Badge variant='secondary'>×{inCart.quantity}</Badge>
                            ) : (
                              <Icons.add className='h-4 w-4 text-muted-foreground' />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className='border-t p-3'>
              <Button className='w-full' onClick={() => setShowProductPanel(false)}>
                Xong ({cart.length} sản phẩm đã chọn)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
