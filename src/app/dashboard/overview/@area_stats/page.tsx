import { getOrderTrendByMonth } from '@/features/overview/api/service';
import { AreaGraph } from '@/features/overview/components/area-graph';

export default async function AreaStats() {
  const data = await getOrderTrendByMonth();
  return <AreaGraph data={data} />;
}
