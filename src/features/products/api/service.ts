// ============================================================
// Product Service — Data Access Layer (Prisma ORM)
// ============================================================
// Chuyển từ Mock Data sang truy vấn Prisma thật.
// Pattern: Server-side functions gọi trực tiếp từ RSC hoặc Server Actions.
// ============================================================

'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type {
  ProductFilters,
  ProductsResponse,
  ProductByIdResponse,
  ProductMutationPayload
} from './types';

export async function getProducts(filters: ProductFilters): Promise<ProductsResponse> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  // Lọc theo tên sản phẩm
  if (filters.search) {
    where.title = { contains: filters.search, mode: 'insensitive' };
  }

  // Lọc theo trạng thái hoạt động
  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  // Xử lý sắp xếp
  let orderBy: Record<string, string> = { createdAt: 'desc' };
  if (filters.sort) {
    try {
      const sortArr = JSON.parse(filters.sort);
      if (Array.isArray(sortArr) && sortArr.length > 0) {
        const { id, desc: isDesc } = sortArr[0];
        orderBy = { [id]: isDesc ? 'desc' : 'asc' };
      }
    } catch {
      // Giữ mặc định nếu parse lỗi
    }
  }

  const [products, totalProducts] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        supplier: { select: { id: true, name: true } },
        _count: { select: { variants: true } }
      }
    }),
    prisma.product.count({ where })
  ]);

  // Serialize Prisma Decimal to Number for Next.js Client Components
  const serializedProducts = products.map((p) => ({
    ...p,
    basePriceCny: Number(p.basePriceCny)
  })) as any[];

  return {
    products: serializedProducts,
    totalProducts,
    page,
    limit
  };
}

export async function getProductById(id: string): Promise<ProductByIdResponse> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      variants: { orderBy: { sku: 'asc' } },
      supplier: true
    }
  });

  if (!product) return { product: null };

  // Serialize Prisma Decimal to Number
  const serializedProduct = {
    ...product,
    basePriceCny: Number(product.basePriceCny),
    variants: product.variants.map((v) => ({
      ...v,
      priceAdjustmentCny: Number(v.priceAdjustmentCny)
    }))
  } as any;

  return { product: serializedProduct };
}

export async function createProduct(data: ProductMutationPayload) {
  const product = await prisma.product.create({
    data: {
      title: data.title,
      description: data.description ?? null,
      basePriceCny: data.basePriceCny,
      images: data.images ?? [],
      supplierId: data.supplierId ?? null,
      isActive: data.isActive ?? true,
      variants: {
        create: data.variants.map((v) => ({
          sku: v.sku,
          attributes: v.attributes,
          priceAdjustmentCny: v.priceAdjustmentCny ?? 0,
          variantImageUrl: v.variantImageUrl ?? null
        }))
      }
    },
    include: {
      variants: true,
      supplier: true
    }
  });

  revalidatePath('/dashboard/product');
  return product as any; // Ignore decimal type for mutation return
}

export async function updateProduct(id: string, data: ProductMutationPayload) {
  const product = await prisma.$transaction(async (tx) => {
    await tx.productVariant.deleteMany({ where: { productId: id } });

    return tx.product.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description ?? null,
        basePriceCny: data.basePriceCny,
        images: data.images ?? [],
        supplierId: data.supplierId ?? null,
        isActive: data.isActive ?? true,
        variants: {
          create: data.variants.map((v) => ({
            sku: v.sku,
            attributes: v.attributes,
            priceAdjustmentCny: v.priceAdjustmentCny ?? 0,
            variantImageUrl: v.variantImageUrl ?? null
          }))
        }
      },
      include: {
        variants: true,
        supplier: true
      }
    });
  });

  revalidatePath('/dashboard/product');
  return product as any;
}

export async function deleteProduct(id: string) {
  await prisma.product.update({
    where: { id },
    data: { isActive: false }
  });

  revalidatePath('/dashboard/product');
}
