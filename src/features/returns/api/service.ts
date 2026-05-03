'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type {
  ReturnFilters,
  ReturnListResponse,
  CreateReturnPayload,
  UpdateReturnPayload
} from './types';

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

export async function getReturns(filters: ReturnFilters): Promise<ReturnListResponse> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (filters.search) {
    where.OR = [
      { lineItem: { historicalName: { contains: filters.search, mode: 'insensitive' } } },
      { lineItem: { historicalSku: { contains: filters.search, mode: 'insensitive' } } },
      { lineItem: { order: { orderNumber: { contains: filters.search, mode: 'insensitive' } } } }
    ];
  }
  if (filters.status && filters.status !== 'all') {
    where.status = filters.status;
  }

  const [returns, totalReturns] = await Promise.all([
    prisma.returnItem.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        lineItem: {
          select: {
            historicalName: true,
            historicalSku: true,
            historicalImageUrl: true,
            order: {
              select: { orderNumber: true, customer: { select: { name: true, phone: true } } }
            }
          }
        },
        deliveryItem: {
          select: {
            delivery: { select: { deliveryCode: true } }
          }
        }
      }
    }),
    prisma.returnItem.count({ where })
  ]);

  return serializeDecimal({ returns, totalReturns, page, limit }) as unknown as ReturnListResponse;
}

export async function createReturn(data: CreateReturnPayload) {
  // Check if delivery item exists
  const deliveryItem = await prisma.customerDeliveryItem.findUnique({
    where: { id: data.deliveryItemId },
    include: { delivery: true }
  });

  if (!deliveryItem) throw new Error('Không tìm thấy thông tin giao hàng');
  if (data.quantity > deliveryItem.quantity)
    throw new Error('Số lượng hoàn trả không thể lớn hơn số lượng đã giao');

  const returnItem = await prisma.returnItem.create({
    data: {
      deliveryItemId: data.deliveryItemId,
      lineItemId: data.lineItemId,
      quantity: data.quantity,
      reason: data.reason,
      note: data.note || null,
      status: 'REQUESTED'
    }
  });

  revalidatePath('/dashboard/return');
  revalidatePath(`/dashboard/delivery/${deliveryItem.deliveryId}`);
  return serializeDecimal(returnItem) as any;
}

export async function updateReturnStatus(id: string, data: UpdateReturnPayload) {
  const returnItem = await prisma.returnItem.findUnique({ where: { id } });
  if (!returnItem) throw new Error('Không tìm thấy yêu cầu hoàn trả');

  const updated = await prisma.returnItem.update({
    where: { id },
    data: {
      status: data.status,
      refundAmountVnd: data.refundAmountVnd,
      note: data.note !== undefined ? data.note : undefined
    }
  });

  revalidatePath('/dashboard/return');
  return serializeDecimal(updated) as any;
}
