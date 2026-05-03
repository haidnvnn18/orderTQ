'use client';

import { LabelList, Pie, PieChart } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';

const chartConfig = {
  count: {
    label: 'Số đơn'
  },
  DRAFT: { label: 'Nháp', color: 'var(--chart-1)' },
  DEPOSITED: { label: 'Đã cọc', color: 'var(--chart-2)' },
  PURCHASED: { label: 'Đã mua', color: 'var(--chart-3)' },
  WAREHOUSE_CN: { label: 'Kho TQ', color: 'var(--chart-4)' },
  WAREHOUSE_VN: { label: 'Kho VN', color: 'var(--chart-5)' },
  DELIVERING: { label: 'Đang giao', color: 'var(--chart-1)' },
  COMPLETED: { label: 'Xong', color: 'var(--chart-2)' },
  CANCELLED: { label: 'Hủy', color: 'var(--chart-3)' }
} satisfies ChartConfig;

export function PieGraph({ data }: { data: { status: string; count: number }[] }) {
  const chartData = data.map((item) => ({
    status: item.status,
    count: item.count,
    fill: `var(--color-${item.status})`
  }));

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader className='items-center pb-0'>
        <CardTitle>Phân bổ trạng thái</CardTitle>
        <CardDescription>Tỉ lệ đơn hàng theo các trạng thái hiện tại</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 items-center justify-center pb-0'>
        <ChartContainer
          config={chartConfig}
          className='[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[300px] min-h-[250px]'
        >
          <PieChart>
            <ChartTooltip content={<ChartTooltipContent nameKey='count' hideLabel />} />
            <Pie
              data={chartData}
              innerRadius={30}
              dataKey='count'
              nameKey='status'
              radius={10}
              cornerRadius={8}
              paddingAngle={4}
            >
              <LabelList
                dataKey='count'
                stroke='none'
                fontSize={12}
                fontWeight={500}
                fill='currentColor'
                formatter={(value: number) => value.toString()}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
