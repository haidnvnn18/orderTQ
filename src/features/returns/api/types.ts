import type {
  ReturnItem,
  ReturnStatus,
  ReturnReason,
  OrderLineItem,
  CustomerDeliveryItem,
  CustomerDelivery
} from '@prisma/client';

export interface ReturnFilters {
  page?: number;
  limit?: number;
  search?: string; // Tên SP, Sku, orderNumber
  status?: ReturnStatus | 'all';
}

export interface ReturnListItem extends ReturnItem {
  lineItem: {
    historicalName: string;
    historicalSku: string;
    historicalImageUrl: string | null;
    order: {
      orderNumber: string;
      customer: { name: string; phone: string | null };
    };
  };
  deliveryItem: {
    delivery: { deliveryCode: string };
  };
}

export interface ReturnListResponse {
  returns: ReturnListItem[];
  totalReturns: number;
  page: number;
  limit: number;
}

export interface CreateReturnPayload {
  deliveryItemId: string;
  lineItemId: string;
  quantity: number;
  reason: ReturnReason;
  note?: string;
}

export interface UpdateReturnPayload {
  status?: ReturnStatus;
  refundAmountVnd?: number;
  note?: string;
}
