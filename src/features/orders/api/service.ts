'use server';

// ============================================================
// Order Service — Data Access Layer (Prisma ORM)
// ============================================================
// Pattern: Server Actions, gọi trực tiếp từ RSC hoặc Client via TanStack Query.
// Tìm kiếm: theo mã đơn (orderNumber) hoặc tên/SĐT khách hàng.
// ============================================================

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type {
  OrderFilters,
  OrdersResponse,
  OrderByIdResponse,
  CreateOrderPayload,
  UpdateOrderStatusPayload
} from './types';

// ============================================================
// GET ALL — Danh sách đơn hàng (phân trang, lọc, tìm kiếm)
// ============================================================
export async function getOrders(filters: OrderFilters): Promise<OrdersResponse> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  // Tìm kiếm theo mã đơn hoặc tên/SĐT khách hàng
  if (filters.search) {
    const keyword = filters.search.trim();
    where.OR = [
      { orderNumber: { contains: keyword, mode: 'insensitive' } },
      { customer: { name: { contains: keyword, mode: 'insensitive' } } },
      { customer: { phone: { contains: keyword, mode: 'insensitive' } } }
    ];
  }

  // Lọc theo trạng thái đơn hàng
  if (filters.status && filters.status !== 'all') {
    where.status = filters.status;
  }

  // Lọc theo trạng thái tài chính
  if (filters.financialStatus && filters.financialStatus !== 'all') {
    where.financialStatus = filters.financialStatus;
  }

  // Sắp xếp
  let orderBy: Record<string, string> = { createdAt: 'desc' };
  if (filters.sort) {
    try {
      const sortArr = JSON.parse(filters.sort);
      if (Array.isArray(sortArr) && sortArr.length > 0) {
        const { id, desc: isDesc } = sortArr[0];
        orderBy = { [id]: isDesc ? 'desc' : 'asc' };
      }
    } catch {
      // Giữ mặc định
    }
  }

  const [orders, totalOrders] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        customer: {
          select: { id: true, name: true, phone: true }
        },
        _count: { select: { lineItems: true } }
      }
    }),
    prisma.order.count({ where })
  ]);

  return {
    orders: orders as any[],
    totalOrders,
    page,
    limit
  };
}

// ============================================================
// GET BY ID — Chi tiết 1 đơn hàng (kèm line items, payments, logs)
// ============================================================
export async function getOrderById(id: string): Promise<OrderByIdResponse> {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true,
          address: true,
          depositRate: true
        }
      },
      lineItems: {
        include: {
          variant: {
            include: {
              product: { select: { id: true, title: true } }
            }
          }
        },
        orderBy: { historicalName: 'asc' }
      },
      payments: {
        orderBy: { paidAt: 'desc' }
      },
      statusLogs: {
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  return { order: order as any };
}

// ============================================================
// CREATE — Tạo đơn hàng mới với line items (atomic transaction)
// ============================================================
export async function createOrder(data: CreateOrderPayload) {
  // Tính tổng tiền VND từ line items
  const totalAmountVnd = data.lineItems.reduce(
    (sum, item) => sum + item.historicalPriceVnd * item.quantity,
    0
  );

  // Cộng thêm phí ship & dịch vụ nếu có
  const grandTotal = totalAmountVnd + (data.shippingFeeVnd ?? 0) + (data.serviceFeeVnd ?? 0);

  // Tạo mã đơn tự động: ORD-YYMMDD-XXX
  const now = new Date();
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, '');

  // Đếm số đơn hôm nay để tạo suffix
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 86400000);
  const countToday = await prisma.order.count({
    where: { createdAt: { gte: startOfDay, lt: endOfDay } }
  });
  const suffix = String(countToday + 1).padStart(3, '0');
  const orderNumber = `ORD-${datePart}-${suffix}`;

  const order = await prisma.$transaction(async (tx) => {
    // 1. Tạo đơn hàng
    const newOrder = await tx.order.create({
      data: {
        orderNumber,
        customerId: data.customerId,
        exchangeRate: data.exchangeRate,
        totalAmountVnd: grandTotal,
        depositAmountVnd: data.depositAmountVnd ?? 0,
        shippingFeeVnd: data.shippingFeeVnd ?? 0,
        serviceFeeVnd: data.serviceFeeVnd ?? 0,
        chinaTrackingNumber: data.chinaTrackingNumber ?? null,
        internalNote: data.internalNote ?? null,
        customerNote: data.customerNote ?? null,
        status: 'DRAFT',
        financialStatus: 'PENDING'
      }
    });

    // 2. Tạo line items
    await tx.orderLineItem.createMany({
      data: data.lineItems.map((item) => ({
        orderId: newOrder.id,
        variantId: item.variantId,
        quantity: item.quantity,
        historicalPriceCny: item.historicalPriceCny,
        historicalPriceVnd: item.historicalPriceVnd,
        historicalSku: item.historicalSku,
        historicalName: item.historicalName,
        historicalImageUrl: item.historicalImageUrl ?? null,
        status: 'PENDING',
        fulfilledQuantity: 0
      }))
    });

    // 3. Ghi log trạng thái ban đầu
    await tx.orderStatusLog.create({
      data: {
        orderId: newOrder.id,
        oldStatus: null,
        newStatus: 'DRAFT',
        note: 'Đơn hàng được tạo mới'
      }
    });

    return newOrder;
  });

  revalidatePath('/dashboard/order');
  return order;
}

// ============================================================
// UPDATE STATUS — Cập nhật trạng thái đơn hàng + ghi log timeline
// ============================================================
export async function updateOrderStatus(id: string, data: UpdateOrderStatusPayload) {
  const currentOrder = await prisma.order.findUnique({
    where: { id },
    select: { status: true }
  });

  if (!currentOrder) throw new Error('Đơn hàng không tồn tại');

  const updated = await prisma.$transaction(async (tx) => {
    // 1. Cập nhật status
    const order = await tx.order.update({
      where: { id },
      data: { status: data.status as any }
    });

    // 2. Ghi log timeline
    await tx.orderStatusLog.create({
      data: {
        orderId: id,
        oldStatus: currentOrder.status as any,
        newStatus: data.status as any,
        changedByName: data.changedByName ?? null,
        note: data.note ?? null
      }
    });

    return order;
  });

  revalidatePath('/dashboard/order');
  revalidatePath(`/dashboard/order/${id}`);
  return updated;
}

// ============================================================
// DELETE — Chỉ xóa đơn DRAFT, không xóa đơn đã xử lý
// ============================================================
export async function deleteOrder(id: string) {
  const order = await prisma.order.findUnique({
    where: { id },
    select: { status: true }
  });

  if (!order) throw new Error('Đơn hàng không tồn tại');
  if (order.status !== 'DRAFT') {
    throw new Error('Chỉ có thể xóa đơn hàng ở trạng thái DRAFT');
  }

  await prisma.order.delete({ where: { id } });
  revalidatePath('/dashboard/order');
}
