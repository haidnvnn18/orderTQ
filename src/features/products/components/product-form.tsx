'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { createProductMutation, updateProductMutation } from '../api/mutations';
import type { Product } from '../api/types';
import type { ProductMutationPayload, VariantPayload } from '../api/types';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useState, useCallback, useRef } from 'react';
import { Icons } from '@/components/icons';
import { createSupabaseClient } from '@/lib/supabase/client';
import Image from 'next/image';

// ============================================================
// Hàm tiện ích: Tự động sinh mã SKU từ prefix + màu + size
// VD: prefix="VAY-01", colors=["DO","XANH"], sizes=["S","M"]
//  => VAY-01-DO-S, VAY-01-DO-M, VAY-01-XANH-S, VAY-01-XANH-M
// ============================================================
function generateVariants(
  skuPrefix: string,
  colorsStr: string,
  sizesStr: string
): VariantPayload[] {
  const colors = colorsStr
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean);
  const sizes = sizesStr
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (colors.length === 0 && sizes.length === 0) {
    // Không có thuộc tính → tạo 1 SKU mặc định
    return [{ sku: skuPrefix || 'DEFAULT', attributes: {}, priceAdjustmentCny: 0 }];
  }

  const variants: VariantPayload[] = [];

  if (colors.length > 0 && sizes.length > 0) {
    for (const color of colors) {
      for (const size of sizes) {
        const skuColor = toSkuPart(color);
        const skuSize = toSkuPart(size);
        variants.push({
          sku: `${skuPrefix}-${skuColor}-${skuSize}`,
          attributes: { color, size },
          priceAdjustmentCny: 0
        });
      }
    }
  } else if (colors.length > 0) {
    for (const color of colors) {
      variants.push({
        sku: `${skuPrefix}-${toSkuPart(color)}`,
        attributes: { color },
        priceAdjustmentCny: 0
      });
    }
  } else {
    for (const size of sizes) {
      variants.push({
        sku: `${skuPrefix}-${toSkuPart(size)}`,
        attributes: { size },
        priceAdjustmentCny: 0
      });
    }
  }

  return variants;
}

// Chuyển tiếng Việt thành dạng SKU: bỏ dấu, viết hoa, thay khoảng trắng
function toSkuPart(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/\s+/g, '')
    .toUpperCase();
}

// ============================================================
// Component chính
// ============================================================
export default function ProductForm({
  initialData,
  pageTitle
}: {
  initialData: Product | null;
  pageTitle: string;
}) {
  const router = useRouter();
  const isEdit = !!initialData;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState(initialData?.title ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [basePriceCny, setBasePriceCny] = useState<string>(
    initialData?.basePriceCny ? String(initialData.basePriceCny) : ''
  );
  const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

  // SKU generation inputs
  const [skuPrefix, setSkuPrefix] = useState('');
  const [colors, setColors] = useState('');
  const [sizes, setSizes] = useState('');

  // Variants preview (auto-generated hoặc từ initialData)
  const [variants, setVariants] = useState<VariantPayload[]>(
    initialData?.variants?.map((v) => ({
      sku: v.sku,
      attributes: v.attributes as Record<string, string>,
      priceAdjustmentCny: Number(v.priceAdjustmentCny) || 0,
      variantImageUrl: v.variantImageUrl ?? undefined
    })) ?? []
  );

  // Image upload state
  const [existingImages, setExistingImages] = useState<string[]>(
    (initialData?.images as string[]) ?? []
  );
  const [uploading, setUploading] = useState(false);

  // Mutations
  const createMutation = useMutation({
    ...createProductMutation,
    onSuccess: () => {
      toast.success('Tạo sản phẩm thành công!');
      router.push('/dashboard/product');
      router.refresh(); // Xóa RSC cache để load lại data mới
    },
    onError: (err) => {
      toast.error(`Lỗi tạo sản phẩm: ${err.message}`);
    }
  });

  const updateMutation = useMutation({
    ...updateProductMutation,
    onSuccess: () => {
      toast.success('Cập nhật sản phẩm thành công!');
      router.push('/dashboard/product');
      router.refresh(); // Xóa RSC cache để load lại data mới
    },
    onError: (err) => {
      toast.error(`Lỗi cập nhật: ${err.message}`);
    }
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  // ============================================================
  // Upload ảnh lên Supabase Storage
  // ============================================================
  const handleImageUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const supabase = createSupabaseClient();
    const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET_NAME || 'image demo';
    const newUrls: string[] = [];

    try {
      for (const file of Array.from(files)) {
        const fileExt = file.name.split('.').pop();
        const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error } = await supabase.storage.from(bucketName).upload(fileName, file);

        if (error) {
          toast.error(`Upload lỗi: ${error.message}`);
          continue;
        }

        const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
        newUrls.push(urlData.publicUrl);
      }

      setExistingImages((prev) => [...prev, ...newUrls]);
      toast.success(`Upload ${newUrls.length} ảnh thành công`);
    } catch {
      toast.error('Lỗi upload ảnh');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, []);

  const removeImage = (index: number) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  // ============================================================
  // Tự động sinh SKU
  // ============================================================
  const handleGenerateVariants = () => {
    if (!skuPrefix.trim()) {
      toast.error('Vui lòng nhập mã SKU gốc (Prefix)');
      return;
    }
    const generated = generateVariants(skuPrefix.trim(), colors, sizes);
    setVariants(generated);
    toast.success(`Đã tạo ${generated.length} biến thể (SKU)`);
  };

  // Xóa 1 variant
  const removeVariant = (index: number) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // ============================================================
  // Submit
  // ============================================================
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Tên sản phẩm không được để trống');
      return;
    }
    if (!basePriceCny || Number(basePriceCny) < 0) {
      toast.error('Giá tệ gốc không hợp lệ');
      return;
    }
    if (variants.length === 0) {
      toast.error('Cần ít nhất 1 biến thể (SKU)');
      return;
    }

    const payload: ProductMutationPayload = {
      title: title.trim(),
      description: description.trim() || undefined,
      basePriceCny: Number(basePriceCny),
      images: existingImages,
      isActive,
      variants
    };

    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, values: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      {/* ===== THÔNG TIN CƠ BẢN ===== */}
      <Card>
        <CardHeader>
          <CardTitle>{pageTitle}</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='title'>Tên sản phẩm *</Label>
              <Input
                id='title'
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder='VD: Váy công chúa Elsa'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='basePriceCny'>Giá tệ gốc (¥) *</Label>
              <Input
                id='basePriceCny'
                type='number'
                step='0.01'
                min='0'
                value={basePriceCny}
                onChange={(e) => setBasePriceCny(e.target.value)}
                placeholder='VD: 45.00'
                required
              />
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>Mô tả</Label>
            <Textarea
              id='description'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='Mô tả chi tiết sản phẩm...'
              rows={3}
            />
          </div>

          <div className='flex items-center gap-3'>
            <Switch id='isActive' checked={isActive} onCheckedChange={setIsActive} />
            <Label htmlFor='isActive'>Đang bán</Label>
          </div>
        </CardContent>
      </Card>

      {/* ===== HÌNH ẢNH ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Hình ảnh sản phẩm</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* Preview ảnh đã upload */}
          {existingImages.length > 0 && (
            <div className='flex flex-wrap gap-3'>
              {existingImages.map((url, i) => (
                <div key={i} className='group relative h-24 w-24'>
                  <Image
                    src={url}
                    alt={`Product image ${i + 1}`}
                    fill
                    sizes='96px'
                    className='rounded-lg border object-cover'
                  />
                  <button
                    type='button'
                    onClick={() => removeImage(i)}
                    className='absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground opacity-0 transition-opacity group-hover:opacity-100'
                  >
                    <Icons.close className='h-3 w-3' />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Upload button */}
          <div>
            <Input
              ref={fileInputRef}
              type='file'
              accept='image/jpeg,image/png,image/webp'
              multiple
              onChange={(e) => handleImageUpload(e.target.files)}
              disabled={uploading}
              className='max-w-sm'
            />
            {uploading && <p className='mt-1 text-sm text-muted-foreground'>Đang upload...</p>}
          </div>
        </CardContent>
      </Card>

      {/* ===== SINH BIẾN THỂ (SKU) TỰ ĐỘNG ===== */}
      <Card>
        <CardHeader>
          <CardTitle>Biến thể sản phẩm (Variants / SKU)</CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
            <div className='space-y-2'>
              <Label htmlFor='skuPrefix'>Mã SKU gốc (Prefix)</Label>
              <Input
                id='skuPrefix'
                value={skuPrefix}
                onChange={(e) => setSkuPrefix(e.target.value.toUpperCase())}
                placeholder='VD: VAY-01'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='colors'>Màu sắc (cách nhau bởi dấu phẩy)</Label>
              <Input
                id='colors'
                value={colors}
                onChange={(e) => setColors(e.target.value)}
                placeholder='VD: Đỏ, Xanh, Hồng'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='sizes'>Kích thước (cách nhau bởi dấu phẩy)</Label>
              <Input
                id='sizes'
                value={sizes}
                onChange={(e) => setSizes(e.target.value)}
                placeholder='VD: S, M, L hoặc 90, 100'
              />
            </div>
          </div>

          <Button type='button' variant='secondary' onClick={handleGenerateVariants}>
            <Icons.add className='mr-2 h-4 w-4' />
            Tạo SKU tự động
          </Button>

          {/* Bảng preview variants */}
          {variants.length > 0 && (
            <div className='rounded-md border'>
              <table className='w-full text-sm'>
                <thead>
                  <tr className='border-b bg-muted/50'>
                    <th className='px-4 py-2 text-left font-medium'>Mã SKU</th>
                    <th className='px-4 py-2 text-left font-medium'>Thuộc tính</th>
                    <th className='px-4 py-2 text-left font-medium'>Giá cộng thêm (¥)</th>
                    <th className='px-4 py-2 text-right font-medium'>Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v, i) => (
                    <tr key={v.sku} className='border-b'>
                      <td className='px-4 py-2 font-mono text-xs'>{v.sku}</td>
                      <td className='px-4 py-2'>
                        {Object.entries(v.attributes).map(([key, val]) => (
                          <Badge key={key} variant='outline' className='mr-1'>
                            {key}: {val}
                          </Badge>
                        ))}
                      </td>
                      <td className='px-4 py-2'>
                        <Input
                          type='number'
                          step='0.01'
                          className='h-8 w-24'
                          value={v.priceAdjustmentCny}
                          onChange={(e) => {
                            const updated = [...variants];
                            updated[i] = { ...v, priceAdjustmentCny: Number(e.target.value) };
                            setVariants(updated);
                          }}
                        />
                      </td>
                      <td className='px-4 py-2 text-right'>
                        <Button
                          type='button'
                          variant='ghost'
                          size='sm'
                          onClick={() => removeVariant(i)}
                        >
                          <Icons.trash className='h-4 w-4 text-destructive' />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {variants.length === 0 && (
            <p className='text-sm text-muted-foreground'>
              Chưa có biến thể. Nhập thông tin ở trên rồi bấm &quot;Tạo SKU tự động&quot;.
            </p>
          )}
        </CardContent>
      </Card>

      {/* ===== BUTTONS ===== */}
      <div className='flex justify-end gap-3'>
        <Button type='button' variant='outline' onClick={() => router.back()}>
          Quay lại
        </Button>
        <Button type='submit' disabled={isPending}>
          {isPending ? 'Đang xử lý...' : isEdit ? 'Cập nhật sản phẩm' : 'Tạo sản phẩm'}
        </Button>
      </div>
    </form>
  );
}
