import { getRecentOrders } from '@/features/overview/api/service';
import { RecentSales } from '@/features/overview/components/recent-sales';

export default async function Sales() {
  const data = await getRecentOrders();
  return <RecentSales data={data} />;
}
