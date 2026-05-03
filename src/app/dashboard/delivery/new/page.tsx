import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export default async function NewDeliveryPage({
  searchParams
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const resolvedParams = await searchParams;
  const orderId = resolvedParams.orderId;

  if (!orderId) {
    redirect('/dashboard/delivery');
  }

  // Tạo delivery trực tiếp (không dùng revalidatePath vì sẽ redirect ngay)
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
      orderId,
      status: 'PACKING',
      shippingFee: 0
    }
  });

  redirect(`/dashboard/delivery/${delivery.id}`);
}
