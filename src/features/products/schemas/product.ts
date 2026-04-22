import * as z from 'zod';

const MAX_FILE_SIZE = 5_000_000;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Schema validation cho variant
const variantSchema = z.object({
  sku: z.string().min(1, 'Mã SKU không được để trống'),
  attributes: z.record(z.string(), z.string()),
  priceAdjustmentCny: z.number().optional(),
  variantImageUrl: z.string().optional()
});

export const productSchema = z.object({
  images: z.any().optional(),
  title: z.string().min(2, 'Tên sản phẩm phải có ít nhất 2 ký tự.'),
  basePriceCny: z.number({ message: 'Giá tệ gốc là bắt buộc' }).min(0, 'Giá không được âm'),
  description: z.string().optional(),
  supplierId: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  variants: z.array(variantSchema).min(1, 'Cần ít nhất 1 biến thể (SKU)')
});

export type ProductFormValues = {
  images: File[] | undefined;
  title: string;
  basePriceCny: number | undefined;
  description: string;
  supplierId: string | null;
  isActive: boolean;
  // Thuộc tính để sinh variants tự động
  colors: string; // "Đỏ, Xanh, Hồng" — nhập bằng dấu phẩy
  sizes: string; // "S, M, L, 90, 100"
  skuPrefix: string; // VD: "VAY-01"
  variants: {
    sku: string;
    attributes: Record<string, string>;
    priceAdjustmentCny: number;
    variantImageUrl: string;
  }[];
  existingImages: string[]; // URLs ảnh đã upload trước đó (khi edit)
};
