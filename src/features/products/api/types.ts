import type { Product as PrismaProduct, ProductVariant, Supplier } from '@prisma/client';

// Product với các quan hệ đã include
export type Product = PrismaProduct & {
  variants: ProductVariant[];
  supplier: Supplier | null;
};

// Product nhẹ cho danh sách (không include variants chi tiết)
export type ProductListItem = PrismaProduct & {
  supplier: { id: string; name: string } | null;
  _count: { variants: number };
};

export type ProductFilters = {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  sort?: string;
};

export type ProductsResponse = {
  products: ProductListItem[];
  totalProducts: number;
  page: number;
  limit: number;
};

export type ProductByIdResponse = {
  product: Product | null;
};

export type ProductMutationPayload = {
  title: string;
  description?: string;
  basePriceCny: number;
  images?: string[]; // URLs từ Supabase Storage
  supplierId?: string | null;
  isActive?: boolean;
  variants: VariantPayload[];
};

export type VariantPayload = {
  sku: string;
  attributes: Record<string, string>; // { color: "Đỏ", size: "90" }
  priceAdjustmentCny?: number;
  variantImageUrl?: string;
};
