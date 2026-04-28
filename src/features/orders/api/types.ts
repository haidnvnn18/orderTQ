// ============================================================
// Order API — Type Definitions
// ============================================================

import type { Decimal } from '@prisma/client/runtime/library';

// ============================================================
// FILTERS
// ============================================================
export interface OrderFilters {
  page?: number;
  limit?: number;
  /** Tìm theo mã đơn hoặc tên/SĐT khách */
  search?: string;
  /** Lọc theo OrderStatus */
  status?: string;
  /** Lọc theo FinancialStatus */
  financialStatus?: string;
  /** JSON string: [{id: 'createdAt', desc: true}] */
  sort?: string;
}

// ============================================================
// SUMMARY — Dùng cho danh sách
// ============================================================
export interface OrderSummary {
  id: string;
  orderNumber: string;
  status: string;
  financialStatus: string;
  totalAmountVnd: Decimal | number;
  paidAmountVnd: Decimal | number;
  depositAmountVnd: Decimal | number;
  exchangeRate: Decimal | number;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: string;
    name: string;
    phone: string;
  };
  _count: {
    lineItems: number;
  };
}

// ============================================================
// DETAIL — Dùng cho trang chi tiết (kèm line items, payments, logs)
// ============================================================
export interface LineItemDetail {
  id: string;
  quantity: number;
  fulfilledQuantity: number;
  status: string;
  historicalPriceCny: Decimal | number;
  historicalPriceVnd: Decimal | number;
  historicalSku: string;
  historicalName: string;
  historicalImageUrl: string | null;
  variant: {
    id: string;
    sku: string;
    attributes: Record<string, string>;
    product: {
      id: string;
      title: string;
    };
  } | null;
}

export interface PaymentDetail {
  id: string;
  amountVnd: Decimal | number;
  method: string;
  note: string | null;
  paidAt: Date;
}

export interface StatusLogDetail {
  id: string;
  oldStatus: string | null;
  newStatus: string;
  changedByName: string | null;
  note: string | null;
  createdAt: Date;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  financialStatus: string;
  exchangeRate: Decimal | number;
  totalAmountVnd: Decimal | number;
  depositAmountVnd: Decimal | number;
  paidAmountVnd: Decimal | number;
  shippingFeeVnd: Decimal | number;
  serviceFeeVnd: Decimal | number;
  chinaTrackingNumber: string | null;
  internalNote: string | null;
  customerNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    address: string | null;
    depositRate: number;
  };
  lineItems: LineItemDetail[];
  payments: PaymentDetail[];
  statusLogs: StatusLogDetail[];
}

// ============================================================
// RESPONSE TYPES
// ============================================================
export interface OrdersResponse {
  orders: OrderSummary[];
  totalOrders: number;
  page: number;
  limit: number;
}

export interface OrderByIdResponse {
  order: OrderDetail | null;
}

// ============================================================
// MUTATION PAYLOADS
// ============================================================

/** 1 line item khi tạo đơn */
export interface CreateLineItemPayload {
  variantId: string;
  quantity: number;
  /** Giá tệ snapshot (lấy từ basePriceCny + priceAdjustmentCny) */
  historicalPriceCny: number;
  /** Giá VND snapshot = historicalPriceCny × exchangeRate */
  historicalPriceVnd: number;
  /** SKU snapshot */
  historicalSku: string;
  /** Tên đầy đủ snapshot */
  historicalName: string;
  historicalImageUrl?: string | null;
}

export interface CreateOrderPayload {
  customerId: string;
  exchangeRate: number;
  depositAmountVnd?: number;
  shippingFeeVnd?: number;
  serviceFeeVnd?: number;
  chinaTrackingNumber?: string | null;
  internalNote?: string | null;
  customerNote?: string | null;
  lineItems: CreateLineItemPayload[];
}

export interface UpdateOrderStatusPayload {
  status: string;
  note?: string | null;
  changedByName?: string | null;
}
