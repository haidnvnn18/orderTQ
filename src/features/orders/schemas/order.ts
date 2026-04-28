import { z } from 'zod';

// ============================================================
// Schema validate line item khi tạo đơn hàng
// ============================================================
export const lineItemSchema = z.object({
  variantId: z.string().uuid('ID sản phẩm không hợp lệ'),
  quantity: z.number().int().min(1, 'Số lượng tối thiểu là 1'),
  historicalPriceCny: z.number().positive('Giá tệ phải lớn hơn 0'),
  historicalPriceVnd: z.number().positive('Giá VND phải lớn hơn 0'),
  historicalSku: z.string().min(1, 'SKU không được để trống'),
  historicalName: z.string().min(1, 'Tên sản phẩm không được để trống'),
  historicalImageUrl: z.string().url().nullable().optional()
});

// ============================================================
// Schema validate tạo đơn hàng
// ============================================================
export const createOrderSchema = z.object({
  customerId: z.string().uuid('Vui lòng chọn khách hàng'),
  exchangeRate: z.number().positive('Tỷ giá phải lớn hơn 0').min(100, 'Tỷ giá quá thấp'),
  depositAmountVnd: z.number().min(0).optional(),
  shippingFeeVnd: z.number().min(0).optional(),
  serviceFeeVnd: z.number().min(0).optional(),
  chinaTrackingNumber: z.string().nullable().optional(),
  internalNote: z.string().nullable().optional(),
  customerNote: z.string().nullable().optional(),
  lineItems: z.array(lineItemSchema).min(1, 'Đơn hàng phải có ít nhất 1 sản phẩm')
});

export type CreateOrderFormValues = z.infer<typeof createOrderSchema>;
export type LineItemFormValues = z.infer<typeof lineItemSchema>;
