'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type { DeliveryStatus, OrderStatus, LineItemStatus } from '@prisma/client';
import type {
  DeliveryFilters,
  DeliveryListResponse,
  DeliveryByIdResponse,
  CreateDeliveryPayload,
  UpdateDeliveryPayload,
  AddDeliveryItemsPayload,
  AvailableDeliveryItem
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

export async function getDeliveries(filters: DeliveryFilters): Promise<DeliveryListResponse> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (filters.search) {
    where.OR = [
      { deliveryCode: { contains: filters.search, mode: 'insensitive' } },
      { trackingNumber: { contains: filters.search, mode: 'insensitive' } },
      { order: { orderNumber: { contains: filters.search, mode: 'insensitive' } } },
      { order: { customer: { name: { contains: filters.search, mode: 'insensitive' } } } }
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

  const [deliveries, totalDeliveries] = await Promise.all([
    prisma.customerDelivery.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        _count: { select: { deliveryItems: true } },
        order: {
          select: {
            orderNumber: true,
            customer: { select: { name: true, phone: true } }
          }
        }
      }
    }),
    prisma.customerDelivery.count({ where })
  ]);

  return serializeDecimal({
    deliveries,
    totalDeliveries,
    page,
    limit
  }) as unknown as DeliveryListResponse;
}

export async function getDeliveryById(id: string): Promise<DeliveryByIdResponse> {
  const delivery = await prisma.customerDelivery.findUnique({
    where: { id },
    include: {
      deliveryItems: {
        include: {
          lineItem: true
        }
      },
      order: {
        include: {
          customer: { select: { name: true, phone: true, address: true } }
        }
      }
    }
  });

  return serializeDecimal({ delivery }) as unknown as DeliveryByIdResponse;
}

export async function createDelivery(data: CreateDeliveryPayload) {
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);

  const countToday = await prisma.customerDelivery.count({
    where: { createdAt: { gte: startOfDay, lt: endOfDay } }
  });
  const deliveryCode = `DEL-${datePart}-${String(countToday + 1).padStart(3, '0')}`;

  const delivery = await prisma.customerDelivery.create({
    data: {
      deliveryCode,
      orderId: data.orderId,
      status: 'PACKING',
      shippingUnit: data.shippingUnit || null,
      trackingNumber: data.trackingNumber || null,
      shippingFee: data.shippingFee || 0,
      note: data.note || null
    }
  });

  revalidatePath('/dashboard/delivery');
  return serializeDecimal(delivery) as any;
}

export async function updateDeliveryStatus(id: string, data: UpdateDeliveryPayload) {
  const delivery = await prisma.customerDelivery.findUnique({
    where: { id },
    include: { deliveryItems: true, order: true }
  });

  if (!delivery) throw new Error('Không tìm thấy phiếu giao');

  const updated = await prisma.$transaction(async (tx) => {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.shippingUnit !== undefined) updateData.shippingUnit = data.shippingUnit;
    if (data.trackingNumber !== undefined) updateData.trackingNumber = data.trackingNumber;
    if (data.shippingFee !== undefined) updateData.shippingFee = data.shippingFee;
    if (data.note !== undefined) updateData.note = data.note;

    // Time marking
    if (data.status === 'SHIPPED' && delivery.status !== 'SHIPPED') {
      updateData.shippedAt = new Date();
    } else if (data.status === 'DELIVERED' && delivery.status !== 'DELIVERED') {
      updateData.deliveredAt = new Date();
    }

    const newDelivery = await tx.customerDelivery.update({
      where: { id },
      data: updateData
    });

    // Auto Sync Logic
    if (data.status && data.status !== delivery.status) {
      // 1. Khi chuyển sang SHIPPED, update Order status
      if (data.status === 'SHIPPED') {
        const orderRank =
          {
            DRAFT: 1,
            DEPOSITED: 2,
            PURCHASED: 3,
            WAREHOUSE_CN: 4,
            WAREHOUSE_VN: 5,
            DELIVERING: 6,
            COMPLETED: 7,
            CANCELLED: 99
          }[delivery.order.status as string] || 0;

        if (orderRank < 6 && delivery.order.status !== 'CANCELLED') {
          await tx.order.update({
            where: { id: delivery.order.id },
            data: { status: 'DELIVERING' }
          });
          await tx.orderStatusLog.create({
            data: {
              orderId: delivery.order.id,
              oldStatus: delivery.order.status,
              newStatus: 'DELIVERING',
              note: 'Hệ thống tự động cập nhật: Đã giao hàng cho khách',
              changedByName: 'Hệ thống'
            }
          });
        }
      }

      // 2. Logic cộng / trừ fulfilledQuantity
      const isBecomingDelivered = data.status === 'DELIVERED';
      const isRevertingFromDelivered =
        delivery.status === 'DELIVERED' && data.status !== 'DELIVERED';

      if (isBecomingDelivered || isRevertingFromDelivered) {
        for (const dItem of delivery.deliveryItems) {
          const lineItem = await tx.orderLineItem.findUnique({ where: { id: dItem.lineItemId } });
          if (!lineItem) continue;

          let newFulfilled = lineItem.fulfilledQuantity;
          if (isBecomingDelivered) newFulfilled += dItem.quantity;
          if (isRevertingFromDelivered) newFulfilled -= dItem.quantity;

          if (newFulfilled < 0) newFulfilled = 0;

          // Determine new LineItem Status
          let newLineStatus = lineItem.status;
          if (newFulfilled >= lineItem.quantity) {
            newLineStatus = 'DELIVERED';
          } else if (isRevertingFromDelivered && lineItem.status === 'DELIVERED') {
            newLineStatus = 'ARRIVED_VN'; // fallback if reverted
          }

          await tx.orderLineItem.update({
            where: { id: lineItem.id },
            data: {
              fulfilledQuantity: newFulfilled,
              status: newLineStatus
            }
          });
        }

        // 3. Nếu becoming Delivered, kiểm tra toàn bộ LineItems xem Order có COMPLETED không
        if (isBecomingDelivered) {
          const allLines = await tx.orderLineItem.findMany({
            where: { orderId: delivery.order.id }
          });
          const allDelivered = allLines.every((li) => li.status === 'DELIVERED');

          if (
            allDelivered &&
            delivery.order.status !== 'COMPLETED' &&
            delivery.order.status !== 'CANCELLED'
          ) {
            await tx.order.update({
              where: { id: delivery.order.id },
              data: { status: 'COMPLETED' }
            });
            await tx.orderStatusLog.create({
              data: {
                orderId: delivery.order.id,
                oldStatus: delivery.order.status,
                newStatus: 'COMPLETED',
                note: 'Hệ thống tự động cập nhật: Toàn bộ sản phẩm đã giao thành công',
                changedByName: 'Hệ thống'
              }
            });
          }
        }
      }
    }

    return newDelivery;
  });

  revalidatePath('/dashboard/delivery');
  revalidatePath(`/dashboard/delivery/${id}`);
  return serializeDecimal(updated) as any;
}

export async function getAvailableLineItemsForDelivery(
  orderId: string
): Promise<AvailableDeliveryItem[]> {
  const lineItems = await prisma.orderLineItem.findMany({
    where: {
      orderId,
      // Chỉ giao những mặt hàng đã về kho VN
      status: { in: ['ARRIVED_VN', 'DELIVERED'] }
    },
    include: {
      deliveryItems: {
        include: { delivery: { select: { status: true } } }
      }
    }
  });

  const available: AvailableDeliveryItem[] = [];

  for (const item of lineItems) {
    // Tính số lượng đang bị giam trong các phiếu giao chưa DELIVERED (PACKING, SHIPPED)
    let lockedQuantity = 0;
    for (const dItem of item.deliveryItems) {
      if (dItem.delivery.status !== 'DELIVERED' && dItem.delivery.status !== 'RETURNED') {
        lockedQuantity += dItem.quantity;
      }
    }

    // available = Tổng sl - đã giao thành công - đang giao dở
    const remaining = item.quantity - item.fulfilledQuantity - lockedQuantity;

    if (remaining > 0) {
      available.push({
        id: item.id,
        historicalName: item.historicalName,
        historicalSku: item.historicalSku,
        historicalImageUrl: item.historicalImageUrl,
        status: item.status,
        quantity: item.quantity,
        fulfilledQuantity: item.fulfilledQuantity,
        remainingQuantity: remaining
      });
    }
  }

  return serializeDecimal(available) as unknown as AvailableDeliveryItem[];
}

export async function addItemsToDelivery(deliveryId: string, payload: AddDeliveryItemsPayload) {
  const delivery = await prisma.customerDelivery.findUnique({ where: { id: deliveryId } });
  if (!delivery) throw new Error('Không tìm thấy phiếu giao');
  if (delivery.status === 'DELIVERED')
    throw new Error('Không thể thêm sản phẩm vào phiếu đã giao thành công');

  const added = await prisma.$transaction(async (tx) => {
    for (const item of payload.items) {
      if (item.quantity <= 0) continue;

      // Kiểm tra xem đã có trong delivery này chưa
      const existing = await tx.customerDeliveryItem.findFirst({
        where: { deliveryId, lineItemId: item.lineItemId }
      });

      if (existing) {
        await tx.customerDeliveryItem.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity }
        });
      } else {
        await tx.customerDeliveryItem.create({
          data: {
            deliveryId,
            lineItemId: item.lineItemId,
            quantity: item.quantity
          }
        });
      }
    }
  });

  revalidatePath(`/dashboard/delivery/${deliveryId}`);
  return added;
}

export async function removeDeliveryItem(itemId: string) {
  const item = await prisma.customerDeliveryItem.findUnique({
    where: { id: itemId },
    include: { delivery: true }
  });
  if (item && item.delivery.status !== 'DELIVERED') {
    await prisma.customerDeliveryItem.delete({ where: { id: itemId } });
    revalidatePath(`/dashboard/delivery/${item.deliveryId}`);
  }
}
