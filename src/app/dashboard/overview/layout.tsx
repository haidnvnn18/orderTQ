import PageContainer from '@/components/layout/page-container';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import React from 'react';
import { getOverviewKPIs } from '@/features/overview/api/service';

export default async function OverViewLayout({
  sales,
  pie_stats,
  bar_stats,
  area_stats
}: {
  sales: React.ReactNode;
  pie_stats: React.ReactNode;
  bar_stats: React.ReactNode;
  area_stats: React.ReactNode;
}) {
  const kpis = await getOverviewKPIs();

  return (
    <PageContainer>
      <div className='flex flex-1 flex-col space-y-2'>
        <div className='flex items-center justify-between'>
          <h2 className='text-2xl font-bold tracking-tight'>Tổng quan hệ thống 👋</h2>
        </div>

        <div className='*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs md:grid-cols-2 lg:grid-cols-4'>
          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Tổng doanh thu (VNĐ)</CardDescription>
              <CardTitle className='text-xl font-semibold tabular-nums @[250px]/card:text-2xl'>
                {new Intl.NumberFormat('vi-VN').format(kpis.totalRevenue)}
              </CardTitle>
              <CardAction>
                <Badge variant='outline' className='text-green-600 border-green-200'>
                  <Icons.check className='w-3 h-3 mr-1' />
                  Thực thu: {new Intl.NumberFormat('vi-VN').format(kpis.paidRevenue)}
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='text-muted-foreground'>Tổng giá trị các đơn hàng (trừ đơn hủy)</div>
            </CardFooter>
          </Card>

          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Số đơn hàng</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {kpis.totalOrders}
              </CardTitle>
              <CardAction>
                <Icons.order className='text-blue-500' />
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='text-muted-foreground'>Số lượng đơn hàng đang được xử lý</div>
            </CardFooter>
          </Card>

          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Tổng khách hàng</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {kpis.totalCustomers}
              </CardTitle>
              <CardAction>
                <Icons.user className='text-indigo-500' />
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='text-muted-foreground'>Số lượng khách hàng đã đăng ký</div>
            </CardFooter>
          </Card>

          <Card className='@container/card'>
            <CardHeader>
              <CardDescription>Tỉ lệ hoàn thành</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {kpis.deliveryRate.toFixed(1)}%
              </CardTitle>
              <CardAction>
                <Badge variant='outline' className='text-amber-600 border-amber-200'>
                  <Icons.trendingUp className='w-3 h-3 mr-1' />
                  Hiệu quả
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='text-muted-foreground'>Tỉ lệ đơn hàng đã giao thành công</div>
            </CardFooter>
          </Card>
        </div>
        <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7'>
          <div className='col-span-4'>{bar_stats}</div>
          <div className='col-span-4 md:col-span-3'>
            {/* sales arallel routes */}
            {sales}
          </div>
          <div className='col-span-4'>{area_stats}</div>
          <div className='col-span-4 min-h-0 md:col-span-3'>{pie_stats}</div>
        </div>
      </div>
    </PageContainer>
  );
}
