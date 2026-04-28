'use server';

// ============================================================
// Product Picker Service — Dùng cho OrderForm
// Lấy danh sách Products + Variants để chọn vào đơn hàng
// ============================================================

import { prisma } from '@/lib/prisma';

export interface ProductPickerItem {
  id: string;
  title: string;
  basePriceCny: number;
  images: string[];
  variants: {
    id: string;
    sku: string;
    attributes: Record<string, string>;
    priceAdjustmentCny: number;
    variantImageUrl: string | null;
    effectivePriceCny: number; // basePriceCny + priceAdjustmentCny
  }[];
}

export async function getProductsForPicker(search?: string): Promise<ProductPickerItem[]> {
  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: 'insensitive' } },
              {
                variants: {
                  some: { sku: { contains: search, mode: 'insensitive' } }
                }
              }
            ]
          }
        : {})
    },
    include: {
      variants: {
        orderBy: { sku: 'asc' }
      }
    },
    orderBy: { title: 'asc' },
    take: 50
  });

  return products.map((p) => ({
    id: p.id,
    title: p.title,
    basePriceCny: Number(p.basePriceCny),
    images: Array.isArray(p.images) ? (p.images as string[]) : [],
    variants: p.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      attributes: v.attributes as Record<string, string>,
      priceAdjustmentCny: Number(v.priceAdjustmentCny),
      variantImageUrl: v.variantImageUrl,
      effectivePriceCny: Number(p.basePriceCny) + Number(v.priceAdjustmentCny)
    }))
  }));
}

export async function getCustomersForPicker(
  search?: string
): Promise<{ id: string; name: string; phone: string; depositRate: number }[]> {
  const customers = await prisma.customer.findMany({
    where: search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { phone: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {},
    select: { id: true, name: true, phone: true, depositRate: true },
    orderBy: { name: 'asc' },
    take: 30
  });

  return customers;
}
