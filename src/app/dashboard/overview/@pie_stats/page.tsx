import { getOrderStatusDistribution } from '@/features/overview/api/service';
import { PieGraph } from '@/features/overview/components/pie-graph';

export default async function PieStats() {
  const data = await getOrderStatusDistribution();
  return <PieGraph data={data} />;
}
