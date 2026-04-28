// ============================================================
// Customer Service — Data Access Layer (Prisma ORM)
// ============================================================
// Pattern: Server Actions, gọi trực tiếp từ RSC hoặc Server Actions.
// Tìm kiếm: theo tên (name) hoặc số điện thoại (phone).
// Phân trang: dựa trên page + limit.
// ============================================================

'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import type {
  CustomerFilters,
  CustomersResponse,
  CustomerByIdResponse,
  CustomerMutationPayload
} from './types';

// ============================================================
// GET ALL — Danh sách khách hàng (có tìm kiếm + phân trang)
// ============================================================
export async function getCustomers(filters: CustomerFilters): Promise<CustomersResponse> {
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 10;
  const skip = (page - 1) * limit;

  // Điều kiện lọc
  const where: Record<string, unknown> = {};

  if (filters.search) {
    const keyword = filters.search.trim();
    where.OR = [
      { name: { contains: keyword, mode: 'insensitive' } },
      { phone: { contains: keyword, mode: 'insensitive' } }
    ];
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

  const [customers, totalCustomers] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        _count: { select: { orders: true } }
      }
    }),
    prisma.customer.count({ where })
  ]);

  return {
    customers: customers as any[],
    totalCustomers,
    page,
    limit
  };
}

// ============================================================
// GET BY ID — Chi tiết 1 khách hàng
// ============================================================
export async function getCustomerById(id: string): Promise<CustomerByIdResponse> {
  const customer = await prisma.customer.findUnique({
    where: { id }
  });

  return { customer: customer as any };
}

// ============================================================
// CREATE — Tạo mới khách hàng
// ============================================================
export async function createCustomer(data: CustomerMutationPayload) {
  const customer = await prisma.customer.create({
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      address: data.address ?? null,
      tags: data.tags ?? [],
      depositRate: data.depositRate ?? 30,
      notes: data.notes ?? null
    }
  });

  revalidatePath('/dashboard/customer');
  return customer;
}

// ============================================================
// UPDATE — Cập nhật thông tin khách hàng
// ============================================================
export async function updateCustomer(id: string, data: CustomerMutationPayload) {
  const customer = await prisma.customer.update({
    where: { id },
    data: {
      name: data.name,
      phone: data.phone,
      email: data.email ?? null,
      address: data.address ?? null,
      tags: data.tags ?? [],
      depositRate: data.depositRate ?? 30,
      notes: data.notes ?? null
    }
  });

  revalidatePath('/dashboard/customer');
  revalidatePath(`/dashboard/customer/${id}`);
  return customer;
}

// ============================================================
// DELETE — Xóa cứng khách hàng (chỉ xóa nếu không có đơn hàng)
// ============================================================
export async function deleteCustomer(id: string) {
  // Kiểm tra xem khách có đơn hàng nào không trước khi xóa
  const orderCount = await prisma.order.count({ where: { customerId: id } });

  if (orderCount > 0) {
    throw new Error(`Không thể xóa khách hàng này vì đang có ${orderCount} đơn hàng liên kết.`);
  }

  await prisma.customer.delete({ where: { id } });

  revalidatePath('/dashboard/customer');
}
