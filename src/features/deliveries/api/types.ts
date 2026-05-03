import type {
  CustomerDelivery,
  CustomerDeliveryItem,
  DeliveryStatus,
  OrderLineItem,
  Order
} from '@prisma/client';

export interface DeliveryFilters {
  page?: number;
  limit?: number;
  search?: string; // Tên khách hàng, mã giao hàng, mã tracking, mã order
  status?: DeliveryStatus | 'all';
  sort?: string;
}

export interface DeliveryListItem extends CustomerDelivery {
  _count: { deliveryItems: number };
  order: {
    orderNumber: string;
    customer: { name: string; phone: string | null };
  };
}

export interface DeliveryListResponse {
  deliveries: DeliveryListItem[];
  totalDeliveries: number;
  page: number;
  limit: number;
}

export interface DeliveryDetailItem extends CustomerDeliveryItem {
  lineItem: OrderLineItem;
}

export interface DeliveryByIdResponse {
  delivery:
    | (CustomerDelivery & {
        deliveryItems: DeliveryDetailItem[];
        order: Order & {
          customer: { name: string; phone: string | null; address: string | null };
        };
      })
    | null;
}

export interface CreateDeliveryPayload {
  orderId: string;
  shippingUnit?: string;
  trackingNumber?: string;
  shippingFee?: number;
  note?: string;
}

export interface UpdateDeliveryPayload {
  status?: DeliveryStatus;
  shippingUnit?: string;
  trackingNumber?: string;
  shippingFee?: number;
  note?: string;
}

export interface AddDeliveryItemsPayload {
  items: Array<{
    lineItemId: string;
    quantity: number;
  }>;
}

export interface AvailableDeliveryItem {
  id: string; // OrderLineItem ID
  historicalName: string;
  historicalSku: string;
  historicalImageUrl: string | null;
  status: string;
  quantity: number;
  fulfilledQuantity: number;
  remainingQuantity: number; // quantity - fulfilledQuantity - (số lượng đang nằm trong các phiếu giao chưa hoàn thành)
}
