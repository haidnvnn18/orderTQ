import { getRevenueByMonth } from '@/features/overview/api/service';
import { BarGraph } from '@/features/overview/components/bar-graph';

export default async function BarStats() {
  const data = await getRevenueByMonth();

  return <BarGraph data={data} />;
}
