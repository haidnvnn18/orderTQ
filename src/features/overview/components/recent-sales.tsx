import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  DRAFT: { label: 'Nháp', color: 'bg-slate-500' },
  DEPOSITED: { label: 'Đã cọc', color: 'bg-blue-500' },
  PURCHASED: { label: 'Đã mua', color: 'bg-amber-500' },
  WAREHOUSE_CN: { label: 'Kho TQ', color: 'bg-orange-500' },
  WAREHOUSE_VN: { label: 'Kho VN', color: 'bg-indigo-500' },
  DELIVERING: { label: 'Đang giao', color: 'bg-cyan-500' },
  COMPLETED: { label: 'Xong', color: 'bg-green-500' },
  CANCELLED: { label: 'Hủy', color: 'bg-red-500' }
};

export function RecentSales({ data }: { data: any[] }) {
  return (
    <Card className='h-full'>
      <CardHeader>
        <CardTitle>Đơn hàng gần đây</CardTitle>
        <CardDescription>Danh sách 5 đơn hàng mới nhất trên hệ thống.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-8'>
          {data.map((order) => (
            <div key={order.id} className='flex items-center'>
              <Avatar className='h-9 w-9'>
                <AvatarFallback>{order.customerName.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className='ml-4 space-y-1 flex-1 min-w-0'>
                <p className='text-sm leading-none font-medium truncate'>{order.customerName}</p>
                <div className='flex items-center gap-2 mt-1'>
                  <span className='text-xs font-mono text-muted-foreground'>
                    {order.orderNumber}
                  </span>
                  <Badge
                    className={`${STATUS_MAP[order.status]?.color} text-[10px] h-4 px-1 text-white`}
                  >
                    {STATUS_MAP[order.status]?.label}
                  </Badge>
                </div>
              </div>
              <div className='ml-auto font-medium text-sm'>
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
                  order.totalAmountVnd
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
