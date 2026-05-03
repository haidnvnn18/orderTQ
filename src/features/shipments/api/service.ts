'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { BatchStatus, LineItemStatus, OrderStatus } from '@prisma/client';
import type {
  ShipmentBatchFilters,
  ShipmentBatchListResponse,
  ShipmentBatchByIdResponse,
  CreateShipmentBatchPayload,
  UpdateShipmentBatchPayload,
  AddItemsToBatchPayload,
  UpdateBatchItemPayload,
  PickerLineItem
} from './types';

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

export async function getShipmentBatches(
  filters: ShipmentBatchFilters
): Promise<ShipmentBatchListResponse> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (filters.search) {
    where.OR = [
      { batchCode: { contains: filters.search, mode: 'insensitive' } },
      { cnTrackingNumber: { contains: filters.search, mode: 'insensitive' } },
      { vnTrackingNumber: { contains: filters.search, mode: 'insensitive' } }
    ];
  }
  if (filters.status && filters.status !== 'all') {
    where.status = filters.status;
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

  const [batches, totalBatches] = await Promise.all([
    prisma.shipmentBatch.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        _count: { select: { batchItems: true } }
      }
    }),
    prisma.shipmentBatch.count({ where })
  ]);

  return serializeDecimal({
    batches,
    totalBatches,
    page,
    limit
  }) as unknown as ShipmentBatchListResponse;
}

export async function getShipmentBatchById(id: string): Promise<ShipmentBatchByIdResponse> {
  const batch = await prisma.shipmentBatch.findUnique({
    where: { id },
    include: {
      batchItems: {
        include: {
          lineItem: {
            include: {
              order: {
                include: { customer: true }
              }
            }
          }
        }
      }
    }
  });

  return serializeDecimal({ batch }) as unknown as ShipmentBatchByIdResponse;
}

export async function createShipmentBatch(data: CreateShipmentBatchPayload) {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  const countToday = await prisma.shipmentBatch.count({
    where: { createdAt: { gte: startOfDay, lt: endOfDay } }
  });
  const batchCode = `BATCH-${datePart}-${String(countToday + 1).padStart(2, '0')}`;

  const batch = await prisma.shipmentBatch.create({
    data: {
      batchCode,
      status: 'PACKING',
      cnTrackingNumber: data.cnTrackingNumber || null,
      vnTrackingNumber: data.vnTrackingNumber || null,
      notes: data.notes || null
    }
  });

  revalidatePath('/dashboard/shipment');
  return serializeDecimal(batch);
}

// --------------------------------------------------------
// AUTO-SYNC LOGIC
// --------------------------------------------------------
const statusRank: Record<LineItemStatus, number> = {
  PENDING: 1,
  ORDERED: 2,
  PRODUCING: 3,
  READY_CN: 4,
  IN_TRANSIT: 5,
  ARRIVED_VN: 6,
  DELIVERED: 7
};

async function syncOrderStatuses(tx: any, orderIds: string[]) {
  const uniqueIds = Array.from(new Set(orderIds));
  for (const oId of uniqueIds) {
    const order = await tx.order.findUnique({
      where: { id: oId },
      include: { lineItems: { select: { status: true } } }
    });
    if (!order || order.lineItems.length === 0) continue;

    // Check if ALL line items reached a certain stage
    const allArrivedVn = order.lineItems.every(
      (item: any) => statusRank[item.status as LineItemStatus] >= statusRank['ARRIVED_VN']
    );
    const allReadyCn = order.lineItems.every(
      (item: any) => statusRank[item.status as LineItemStatus] >= statusRank['READY_CN']
    );

    const currentOrderRank =
      {
        DRAFT: 1,
        DEPOSITED: 2,
        PURCHASED: 3,
        WAREHOUSE_CN: 4,
        WAREHOUSE_VN: 5,
        DELIVERING: 6,
        COMPLETED: 7,
        CANCELLED: 99
      }[order.status as string] || 0;

    if (allArrivedVn && currentOrderRank < 5 && order.status !== 'CANCELLED') {
      await tx.order.update({ where: { id: oId }, data: { status: 'WAREHOUSE_VN' } });
      await tx.orderStatusLog.create({
        data: {
          orderId: oId,
          oldStatus: order.status,
          newStatus: 'WAREHOUSE_VN',
          note: 'Hệ thống tự động cập nhật: Toàn bộ sản phẩm đã về kho VN',
          changedByName: 'Hệ thống'
        }
      });
    } else if (allReadyCn && currentOrderRank < 4 && order.status !== 'CANCELLED') {
      await tx.order.update({ where: { id: oId }, data: { status: 'WAREHOUSE_CN' } });
      await tx.orderStatusLog.create({
        data: {
          orderId: oId,
          oldStatus: order.status,
          newStatus: 'WAREHOUSE_CN',
          note: 'Hệ thống tự động cập nhật: Toàn bộ sản phẩm đã sẵn sàng tại kho TQ',
          changedByName: 'Hệ thống'
        }
      });
    }
  }
}

export async function updateShipmentBatchStatus(id: string, data: UpdateShipmentBatchPayload) {
  const batch = await prisma.shipmentBatch.findUnique({
    where: { id },
    include: { batchItems: true }
  });
  if (!batch) throw new Error('Không tìm thấy kiện hàng');

  const updated = await prisma.$transaction(async (tx) => {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.cnTrackingNumber !== undefined) updateData.cnTrackingNumber = data.cnTrackingNumber;
    if (data.vnTrackingNumber !== undefined) updateData.vnTrackingNumber = data.vnTrackingNumber;
    if (data.totalWeightKg !== undefined) updateData.totalWeightKg = data.totalWeightKg;
    if (data.totalVolumeM3 !== undefined) updateData.totalVolumeM3 = data.totalVolumeM3;
    if (data.shippingFeeTotal !== undefined) updateData.shippingFeeTotal = data.shippingFeeTotal;
    if (data.notes !== undefined) updateData.notes = data.notes;

    if (data.status === 'ARRIVED_VN' && batch.status !== 'ARRIVED_VN') {
      updateData.arrivedAtVnAt = new Date();
    } else if (data.status === 'IN_TRANSIT' && batch.status !== 'IN_TRANSIT') {
      // optional: mark shipped time if needed
    }

    const newBatch = await tx.shipmentBatch.update({
      where: { id },
      data: updateData
    });

    // Auto-sync LineItems
    if (data.status && data.status !== batch.status) {
      let newLineItemStatus: LineItemStatus | null = null;
      if (data.status === 'IN_TRANSIT') newLineItemStatus = 'IN_TRANSIT';
      else if (data.status === 'ARRIVED_VN') newLineItemStatus = 'ARRIVED_VN';
      // DISTRIBUTED doesn't necessarily change line item status until delivered.

      if (newLineItemStatus) {
        const affectedOrderIds: string[] = [];

        for (const bItem of batch.batchItems) {
          const lineItem = await tx.orderLineItem.findUnique({ where: { id: bItem.lineItemId } });
          if (lineItem && statusRank[newLineItemStatus] > statusRank[lineItem.status]) {
            await tx.orderLineItem.update({
              where: { id: lineItem.id },
              data: { status: newLineItemStatus }
            });
            affectedOrderIds.push(lineItem.orderId);
          }
        }

        // Sync parent orders
        if (affectedOrderIds.length > 0) {
          await syncOrderStatuses(tx, affectedOrderIds);
        }
      }
    }

    return newBatch;
  });

  revalidatePath('/dashboard/shipment');
  revalidatePath(`/dashboard/shipment/${id}`);
  return serializeDecimal(updated) as any;
}

// --------------------------------------------------------
// BATCH ITEMS MANAGEMENT
// --------------------------------------------------------

// Lấy danh sách LineItem hợp lệ (>= READY_CN và chưa gán hết vào các batch khác)
export async function getAvailableLineItemsForBatch(): Promise<PickerLineItem[]> {
  // Lấy các line items từ kho TQ trở đi, chưa về đến VN
  const lineItems = await prisma.orderLineItem.findMany({
    where: {
      status: { in: ['READY_CN', 'IN_TRANSIT'] }
    },
    include: {
      order: { select: { orderNumber: true } },
      shipmentBatchItems: { select: { expectedQuantity: true } },
      chinaPOLineItems: {
        include: {
          chinaPo: {
            include: { supplier: { select: { id: true, name: true } } }
          }
        }
      }
    },
    orderBy: { order: { createdAt: 'desc' } }
  });

  const available: PickerLineItem[] = [];

  for (const item of lineItems) {
    const assignedQty = item.shipmentBatchItems.reduce((acc, bi) => acc + bi.expectedQuantity, 0);
    const remainingQty = item.quantity - assignedQty;

    if (remainingQty > 0) {
      available.push({
        id: item.id,
        historicalName: item.historicalName,
        historicalSku: item.historicalSku,
        historicalImageUrl: item.historicalImageUrl,
        quantity: remainingQty,
        status: item.status,
        chinaPoLineItem: (item.chinaPOLineItems as any[])[0] || null,
        order: { orderNumber: item.order.orderNumber }
      });
    }
  }

  return serializeDecimal(available) as unknown as PickerLineItem[];
}

export async function addItemsToBatch(batchId: string, data: AddItemsToBatchPayload) {
  if (!data.lineItemIds || data.lineItemIds.length === 0) return;

  const added = await prisma.$transaction(async (tx) => {
    // Để an toàn, lấy ra remaining quantity của từng lineItem
    for (const lineItemId of data.lineItemIds) {
      const lineItem = await tx.orderLineItem.findUnique({
        where: { id: lineItemId },
        include: { shipmentBatchItems: true }
      });
      if (!lineItem) continue;

      const assignedQty = lineItem.shipmentBatchItems.reduce(
        (acc, bi) => acc + bi.expectedQuantity,
        0
      );
      const remainingQty = lineItem.quantity - assignedQty;

      if (remainingQty > 0) {
        await tx.shipmentBatchItem.create({
          data: {
            shipmentBatchId: batchId,
            lineItemId: lineItemId,
            expectedQuantity: remainingQty,
            quantity: 0 // Sẽ update khi hàng về thực tế kiểm đếm (hoặc mặc định bằng expected)
          }
        });
      }
    }
  });

  revalidatePath(`/dashboard/shipment/${batchId}`);
  return added;
}

export async function removeBatchItem(batchItemId: string) {
  const item = await prisma.shipmentBatchItem.findUnique({ where: { id: batchItemId } });
  if (item) {
    await prisma.shipmentBatchItem.delete({ where: { id: batchItemId } });
    revalidatePath(`/dashboard/shipment/${item.shipmentBatchId}`);
  }
}

export async function updateBatchItem(batchItemId: string, data: UpdateBatchItemPayload) {
  const item = await prisma.shipmentBatchItem.update({
    where: { id: batchItemId },
    data: {
      quantity: data.quantity,
      discrepancyNote: data.discrepancyNote
    }
  });
  revalidatePath(`/dashboard/shipment/${item.shipmentBatchId}`);
  return serializeDecimal(item) as any;
}
