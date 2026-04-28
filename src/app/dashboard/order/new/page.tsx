import PageContainer from '@/components/layout/page-container';
import OrderForm from '@/features/orders/components/order-form';

export const metadata = {
  title: 'Dashboard: Tạo đơn hàng mới'
};

export default function Page() {
  return (
    <PageContainer
      pageTitle='Tạo đơn hàng mới'
      pageDescription='Chọn khách hàng, sản phẩm và điền thông tin để tạo đơn hàng mới.'
    >
      <OrderForm />
    </PageContainer>
  );
}
