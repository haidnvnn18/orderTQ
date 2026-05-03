'use client';

import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import React from 'react';

const chartConfig = {
  newOrders: {
    label: 'Đơn mới',
    color: 'var(--chart-1)'
  },
  completedOrders: {
    label: 'Hoàn thành',
    color: 'var(--chart-2)'
  }
} satisfies ChartConfig;

export function AreaGraph({
  data
}: {
  data: { month: string; newOrders: number; completedOrders: number }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Xu hướng đơn hàng</CardTitle>
        <CardDescription>
          Số lượng đơn hàng mới và đơn hoàn thành trong 12 tháng qua
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart accessibilityLayer data={data}>
            <CartesianGrid vertical={false} strokeDasharray='3 3' />
            <XAxis dataKey='month' tickLine={false} axisLine={false} tickMargin={8} />
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <defs>
              <DottedBackgroundPattern config={chartConfig} />
            </defs>
            <Area
              dataKey='completedOrders'
              type='natural'
              fill='url(#dotted-background-pattern-completedOrders)'
              fillOpacity={0.4}
              stroke='var(--color-completedOrders)'
              stackId='a'
              strokeWidth={0.8}
            />
            <Area
              dataKey='newOrders'
              type='natural'
              fill='url(#dotted-background-pattern-newOrders)'
              fillOpacity={0.4}
              stroke='var(--color-newOrders)'
              stackId='a'
              strokeWidth={0.8}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const DottedBackgroundPattern = ({ config }: { config: ChartConfig }) => {
  const items = Object.fromEntries(
    Object.entries(config).map(([key, value]) => [key, value.color])
  );
  return (
    <>
      {Object.entries(items).map(([key, value]) => (
        <pattern
          key={key}
          id={`dotted-background-pattern-${key}`}
          x='0'
          y='0'
          width='7'
          height='7'
          patternUnits='userSpaceOnUse'
        >
          <circle cx='5' cy='5' r='1.5' fill={value} opacity={0.5}></circle>
        </pattern>
      ))}
    </>
  );
};
