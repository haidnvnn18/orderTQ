'use server';

import { prisma } from '@/lib/prisma';
import { startOfMonth, subMonths, endOfMonth, format } from 'date-fns';

export async function getOverviewKPIs() {
  const [totalOrders, totalCustomers, ordersData] = await Promise.all([
    prisma.order.count({ where: { status: { not: 'CANCELLED' } } }),
    prisma.customer.count(),
    prisma.order.aggregate({
      where: { status: { not: 'CANCELLED' } },
      _sum: {
        totalAmountVnd: true,
        paidAmountVnd: true
      }
    })
  ]);

  const completedOrders = await prisma.order.count({
    where: { status: 'COMPLETED' }
  });

  const totalRevenue = Number(ordersData._sum.totalAmountVnd || 0);
  const paidRevenue = Number(ordersData._sum.paidAmountVnd || 0);
  const deliveryRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

  return {
    totalRevenue,
    paidRevenue,
    totalOrders,
    totalCustomers,
    deliveryRate
  };
}

export async function getRevenueByMonth() {
  const last6Months = Array.from({ length: 6 }).map((_, i) => {
    const date = subMonths(new Date(), 5 - i);
    return {
      start: startOfMonth(date),
      end: endOfMonth(date),
      label: format(date, 'MMMM')
    };
  });

  const stats = await Promise.all(
    last6Months.map(async (month) => {
      const data = await prisma.order.aggregate({
        where: {
          createdAt: { gte: month.start, lte: month.end },
          status: { not: 'CANCELLED' }
        },
        _sum: {
          totalAmountVnd: true,
          paidAmountVnd: true
        }
      });

      return {
        month: month.label,
        total: Number(data._sum.totalAmountVnd || 0),
        paid: Number(data._sum.paidAmountVnd || 0)
      };
    })
  );

  return stats;
}

export async function getRecentOrders() {
  const orders = await prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      customer: { select: { name: true, phone: true } }
    }
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    totalAmountVnd: Number(order.totalAmountVnd),
    status: order.status,
    createdAt: order.createdAt
  }));
}

export async function getOrderStatusDistribution() {
  const stats = await prisma.order.groupBy({
    by: ['status'],
    _count: { _all: true }
  });

  return stats.map((s) => ({
    status: s.status,
    count: s._count._all
  }));
}

export async function getOrderTrendByMonth() {
  const last12Months = Array.from({ length: 12 }).map((_, i) => {
    const date = subMonths(new Date(), 11 - i);
    return {
      start: startOfMonth(date),
      end: endOfMonth(date),
      label: format(date, 'MMM')
    };
  });

  const stats = await Promise.all(
    last12Months.map(async (month) => {
      const [newOrders, completedOrders] = await Promise.all([
        prisma.order.count({
          where: { createdAt: { gte: month.start, lte: month.end } }
        }),
        prisma.order.count({
          where: {
            updatedAt: { gte: month.start, lte: month.end },
            status: 'COMPLETED'
          }
        })
      ]);

      return {
        month: month.label,
        newOrders,
        completedOrders
      };
    })
  );

  return stats;
}
