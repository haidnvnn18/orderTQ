import * as z from 'zod';

// Regex số điện thoại Việt Nam:
// - Bắt đầu bằng 0 hoặc +84
// - Đầu số hợp lệ: 03x, 05x, 07x, 08x, 09x
// - Tổng 10 chữ số (hoặc 11 ký tự nếu có +84)
const PHONE_REGEX = /^(0|\+84)(3[2-9]|5[6-9]|7[06-9]|8[0-9]|9[0-9])\d{7}$/;

export const customerSchema = z.object({
  name: z
    .string({ message: 'Tên khách hàng là bắt buộc' })
    .min(2, 'Tên phải có ít nhất 2 ký tự')
    .max(100, 'Tên không được vượt quá 100 ký tự'),

  phone: z
    .string({ message: 'Số điện thoại là bắt buộc' })
    .regex(PHONE_REGEX, 'Số điện thoại không hợp lệ (VD: 0901234567 hoặc +84901234567)'),

  email: z.string().email('Email không đúng định dạng').optional().or(z.literal('')),

  address: z.string().max(255, 'Địa chỉ không được vượt quá 255 ký tự').optional(),

  depositRate: z
    .number({ message: 'Tỷ lệ cọc là bắt buộc và phải là số' })
    .int('Tỷ lệ cọc phải là số nguyên')
    .min(0, 'Tỷ lệ cọc tối thiểu là 0%')
    .max(100, 'Tỷ lệ cọc tối đa là 100%')
    .default(30),

  tags: z.array(z.string()).default([]),

  notes: z.string().optional()
});

export type CustomerFormValues = z.infer<typeof customerSchema>;
