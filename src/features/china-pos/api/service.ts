'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type {
  ChinaPOFilters,
  ChinaPOResponse,
  ChinaPOByIdResponse,
  CreateChinaPOPayload,
  UpdateChinaPOPayload,
  PendingSupplierGroup
} from './types';
import type { LineItemStatus } from '@prisma/client';

// Helper: Chuyển đổi Prisma.Decimal thành number
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

// Lấy danh sách các Line Item đang PENDING, gom theo Supplier
// Xử lý trường hợp variantId bị null (do updateProduct xóa/tạo lại variants)
export async function getPendingLineItems(): Promise<{ groups: PendingSupplierGroup[] }> {
  const lineItems = await prisma.orderLineItem.findMany({
    where: { status: 'PENDING' },
    include: {
      order: { select: { id: true, orderNumber: true, createdAt: true } },
      variant: {
        include: {
          product: {
            include: {
              supplier: { select: { id: true, name: true } }
            }
          }
        }
      }
    },
    orderBy: { order: { createdAt: 'asc' } }
  });

  // ── Bước 1: Tự động hàn lại variantId bị đứt ──
  // Khi updateProduct xóa variants cũ → tạo lại mới, OrderLineItem.variantId bị set null.
  // Ta tìm variant mới theo historicalSku để nối lại.
  const brokenItems = lineItems.filter((item) => !item.variantId || !item.variant);
  if (brokenItems.length > 0) {
    const skus = brokenItems.map((item) => item.historicalSku).filter(Boolean);
    const matchingVariants = await prisma.productVariant.findMany({
      where: { sku: { in: skus } },
      include: {
        product: {
          include: {
            supplier: { select: { id: true, name: true } }
          }
        }
      }
    });

    // Map SKU → variant để tra cứu nhanh
    const skuToVariant = new Map(matchingVariants.map((v) => [v.sku, v]));

    // Hàn lại variantId và gắn dữ liệu variant vào memory
    for (const item of brokenItems) {
      const matched = skuToVariant.get(item.historicalSku);
      if (matched) {
        // Cập nhật DB để hàn lại liên kết (fire-and-forget, không block)
        prisma.orderLineItem
          .update({
            where: { id: item.id },
            data: { variantId: matched.id }
          })
          .catch(() => {
            /* ignore nếu constraint vi phạm */
          });

        // Gắn lại vào bộ nhớ cho lần render này
        (item as any).variant = matched;
        (item as any).variantId = matched.id;
      }
    }
  }

  // ── Bước 2: Gom nhóm theo Supplier ──
  const groupsMap = new Map<string, PendingSupplierGroup>();

  for (const item of lineItems) {
    const supplierId = (item as any).variant?.product?.supplier?.id || 'unknown';
    const supplierName = (item as any).variant?.product?.supplier?.name || 'Chưa gán Nhà cung cấp';

    if (!groupsMap.has(supplierId)) {
      groupsMap.set(supplierId, {
        supplierId,
        supplierName,
        totalItems: 0,
        totalQuantity: 0,
        lineItems: []
      });
    }

    const group = groupsMap.get(supplierId)!;
    group.totalItems += 1;
    group.totalQuantity += item.quantity;
    group.lineItems.push({
      id: item.id,
      orderId: item.orderId,
      orderNumber: item.order.orderNumber,
      historicalName: item.historicalName,
      historicalSku: item.historicalSku,
      historicalPriceCny: item.historicalPriceCny,
      quantity: item.quantity,
      variantId: (item as any).variantId,
      supplierId: supplierId !== 'unknown' ? supplierId : null,
      supplierName,
      historicalImageUrl: item.historicalImageUrl,
      createdAt: item.order.createdAt
    });
  }

  return serializeDecimal({ groups: Array.from(groupsMap.values()) });
}

export async function getChinaPOs(filters: ChinaPOFilters): Promise<ChinaPOResponse> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (filters.search) {
    where.poNumber = { contains: filters.search, mode: 'insensitive' };
  }
  if (filters.status && filters.status !== 'all') {
    where.status = filters.status;
  }
  if (filters.supplierId && filters.supplierId !== 'all') {
    where.supplierId = filters.supplierId;
  }

  let orderBy: Record<string, string> = { createdAt: 'desc' };
  if (filters.sort) {
    try {
      const sortArr = JSON.parse(filters.sort);
      if (Array.isArray(sortArr) && sortArr.length > 0) {
        const { id, desc } = sortArr[0];
        orderBy = { [id]: desc ? 'desc' : 'asc' };
      }
    } catch {
      // ignore
    }
  }

  const [pos, totalPOs] = await Promise.all([
    prisma.chinaPurchaseOrder.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        supplier: { select: { id: true, name: true } },
        _count: { select: { poLineItems: true } }
      }
    }),
    prisma.chinaPurchaseOrder.count({ where })
  ]);

  return serializeDecimal({
    pos,
    totalPOs,
    page,
    limit
  });
}

export async function getChinaPOById(id: string): Promise<ChinaPOByIdResponse> {
  const po = await prisma.chinaPurchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: true,
      poLineItems: {
        include: {
          lineItem: {
            include: {
              order: { select: { id: true, orderNumber: true } }
            }
          }
        }
      }
    }
  });

  return serializeDecimal({ po });
}

// Cập nhật Order.status nếu tất cả LineItems của Order đó đã >= ORDERED
async function tryAdvanceOrderStatusToPurchased(tx: any, orderIds: string[]) {
  // Lọc lấy các orderId duy nhất
  const uniqueOrderIds = Array.from(new Set(orderIds));

  for (const orderId of uniqueOrderIds) {
    // Đếm số lượng line item còn PENDING của order này
    const pendingCount = await tx.orderLineItem.count({
      where: {
        orderId,
        status: 'PENDING'
      }
    });

    if (pendingCount === 0) {
      // Cập nhật status thành PURCHASED nếu đang ở DRAFT hoặc DEPOSITED
      const currentOrder = await tx.order.findUnique({ where: { id: orderId } });
      if (
        currentOrder &&
        (currentOrder.status === 'DRAFT' || currentOrder.status === 'DEPOSITED')
      ) {
        await tx.order.update({
          where: { id: orderId },
          data: { status: 'PURCHASED' }
        });

        await tx.orderStatusLog.create({
          data: {
            orderId,
            oldStatus: currentOrder.status,
            newStatus: 'PURCHASED',
            note: 'Hệ thống tự động cập nhật: Đã đặt mua toàn bộ sản phẩm bên TQ',
            changedByName: 'Hệ thống'
          }
        });
      }
    }
  }
}

export async function createChinaPO(data: CreateChinaPOPayload) {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  const countToday = await prisma.chinaPurchaseOrder.count({
    where: { createdAt: { gte: startOfDay, lt: endOfDay } }
  });
  const poNumber = `PO-${datePart}-${String(countToday + 1).padStart(3, '0')}`;

  // ── Auto-resolve supplier nếu client gửi 'unknown' ──
  let resolvedSupplierId = data.supplierId;
  if (!resolvedSupplierId || resolvedSupplierId === 'unknown') {
    // Lấy SKU từ line items đầu tiên để truy ngược supplier
    const firstLineItem = await prisma.orderLineItem.findUnique({
      where: { id: data.items[0]?.lineItemId },
      select: { historicalSku: true, variantId: true }
    });

    if (firstLineItem) {
      // Thử qua variantId trước
      if (firstLineItem.variantId) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: firstLineItem.variantId },
          include: { product: { select: { supplierId: true } } }
        });
        if (variant?.product?.supplierId) {
          resolvedSupplierId = variant.product.supplierId;
        }
      }
      // Fallback: tìm qua SKU
      if (!resolvedSupplierId || resolvedSupplierId === 'unknown') {
        const variantBySku = await prisma.productVariant.findFirst({
          where: { sku: firstLineItem.historicalSku },
          include: { product: { select: { supplierId: true } } }
        });
        if (variantBySku?.product?.supplierId) {
          resolvedSupplierId = variantBySku.product.supplierId;
        }
      }
    }

    if (!resolvedSupplierId || resolvedSupplierId === 'unknown') {
      throw new Error(
        'Không tìm được Nhà cung cấp hợp lệ cho các sản phẩm này. Vui lòng gán Nhà cung cấp cho Sản phẩm trước.'
      );
    }
  }

  const po = await prisma.$transaction(async (tx) => {
    // 1. Tạo PO
    const newPO = await tx.chinaPurchaseOrder.create({
      data: {
        poNumber,
        supplierId: resolvedSupplierId,
        totalAmountCny: data.totalAmountCny,
        note: data.note,
        status: 'DRAFT'
      }
    });

    // 2. Tạo PO Line Items và lấy danh sách orderId bị ảnh hưởng
    const affectedOrderIds: string[] = [];

    for (const item of data.items) {
      await tx.chinaPOLineItem.create({
        data: {
          chinaPoId: newPO.id,
          lineItemId: item.lineItemId,
          quantity: item.quantity,
          unitPriceCny: item.unitPriceCny
        }
      });

      const updatedLineItem = await tx.orderLineItem.update({
        where: { id: item.lineItemId },
        data: { status: 'ORDERED' }
      });
      affectedOrderIds.push(updatedLineItem.orderId);
    }

    // 3. Tự động kiểm tra và nâng status Order
    await tryAdvanceOrderStatusToPurchased(tx, affectedOrderIds);

    return newPO;
  });

  revalidatePath('/dashboard/china-po');
  return serializeDecimal(po);
}

export async function updateChinaPOStatus(id: string, data: UpdateChinaPOPayload) {
  const currentPO = await prisma.chinaPurchaseOrder.findUnique({
    where: { id },
    include: { poLineItems: true }
  });

  if (!currentPO) throw new Error('Không tìm thấy mã PO');

  const updated = await prisma.$transaction(async (tx) => {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.trackingNumber !== undefined) updateData.trackingNumber = data.trackingNumber;
    if (data.note !== undefined) updateData.note = data.note;

    const newPO = await tx.chinaPurchaseOrder.update({
      where: { id },
      data: updateData
    });

    // Đồng bộ trạng thái sang LineItem nếu đổi Status
    if (data.status && data.status !== currentPO.status) {
      let newLineItemStatus: LineItemStatus | null = null;

      if (data.status === 'PRODUCING') newLineItemStatus = 'PRODUCING';
      else if (data.status === 'READY') newLineItemStatus = 'READY_CN';
      else if (data.status === 'SHIPPED')
        newLineItemStatus = 'READY_CN'; // Chờ Gom kiện mới thành IN_TRANSIT
      else if (data.status === 'COMPLETED') newLineItemStatus = 'READY_CN';

      if (newLineItemStatus) {
        for (const poItem of currentPO.poLineItems) {
          // Lấy status hiện tại của lineItem
          const lineItem = await tx.orderLineItem.findUnique({
            where: { id: poItem.lineItemId },
            select: { status: true }
          });

          // Chỉ cập nhật tiến tới, không lùi (ví dụ nó đã IN_TRANSIT rồi thì kệ nó)
          const statusRank: Record<LineItemStatus, number> = {
            PENDING: 1,
            ORDERED: 2,
            PRODUCING: 3,
            READY_CN: 4,
            IN_TRANSIT: 5,
            ARRIVED_VN: 6,
            DELIVERED: 7
          };

          if (lineItem && statusRank[newLineItemStatus] > statusRank[lineItem.status]) {
            await tx.orderLineItem.update({
              where: { id: poItem.lineItemId },
              data: { status: newLineItemStatus }
            });
          }
        }
      }
    }

    return newPO;
  });

  revalidatePath('/dashboard/china-po');
  revalidatePath(`/dashboard/china-po/${id}`);
  return serializeDecimal(updated);
}
