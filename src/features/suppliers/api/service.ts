'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';

// ============================================================
// Helpers
// ============================================================
function serializeDecimal<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'object') {
    if ('toNumber' in obj && typeof (obj as any).toNumber === 'function') {
      return (obj as any).toNumber() as any;
    }
    if (obj instanceof Date) return obj;
    if (Array.isArray(obj)) return obj.map(serializeDecimal) as any;
    const res: any = {};
    for (const key in obj) {
      res[key] = serializeDecimal((obj as any)[key]);
    }
    return res;
  }
  return obj;
}

// ============================================================
// GET ALL — Danh sách tất cả Supplier
// ============================================================
export async function getSuppliers() {
  const suppliers = await prisma.supplier.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: { select: { products: true, chinaPOs: true } }
    }
  });
  return serializeDecimal({ suppliers });
}

// ============================================================
// GET BY ID
// ============================================================
export async function getSupplierById(id: string) {
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      products: {
        select: { id: true, title: true, basePriceCny: true, isActive: true },
        orderBy: { title: 'asc' }
      },
      _count: { select: { chinaPOs: true } }
    }
  });
  return serializeDecimal({ supplier });
}

// ============================================================
// CREATE
// ============================================================
export async function createSupplier(data: {
  name: string;
  platformUrl?: string | null;
  contactInfo?: string | null;
  reliabilityScore?: number;
}) {
  const supplier = await prisma.supplier.create({
    data: {
      name: data.name,
      platformUrl: data.platformUrl ?? null,
      contactInfo: data.contactInfo ?? null,
      reliabilityScore: data.reliabilityScore ?? 100
    }
  });
  revalidatePath('/dashboard/supplier');
  return serializeDecimal(supplier);
}

// ============================================================
// UPDATE
// ============================================================
export async function updateSupplier(
  id: string,
  data: {
    name?: string;
    platformUrl?: string | null;
    contactInfo?: string | null;
    reliabilityScore?: number;
  }
) {
  const supplier = await prisma.supplier.update({
    where: { id },
    data
  });
  revalidatePath('/dashboard/supplier');
  revalidatePath(`/dashboard/supplier/${id}`);
  return serializeDecimal(supplier);
}

// ============================================================
// DELETE
// ============================================================
export async function deleteSupplier(id: string) {
  // Kiểm tra xem có PO nào liên kết không
  const poCount = await prisma.chinaPurchaseOrder.count({ where: { supplierId: id } });
  if (poCount > 0) {
    throw new Error('Không thể xóa nhà cung cấp đang có mã đặt hàng (PO). Hãy xóa PO trước.');
  }

  // Gỡ supplierId khỏi các sản phẩm trước khi xóa
  await prisma.product.updateMany({
    where: { supplierId: id },
    data: { supplierId: null }
  });

  await prisma.supplier.delete({ where: { id } });
  revalidatePath('/dashboard/supplier');
}

// ============================================================
// GET ALL (Simple list cho dropdown)
// ============================================================
export async function getSuppliersList() {
  const suppliers = await prisma.supplier.findMany({
    select: { id: true, name: true },
    orderBy: { name: 'asc' }
  });
  return suppliers;
}
