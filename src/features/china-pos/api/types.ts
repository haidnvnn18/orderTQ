import { Prisma } from '@prisma/client';
type Decimal = Prisma.Decimal;

export interface ChinaPOFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  supplierId?: string;
  sort?: string;
}

export interface ChinaPOResponse {
  pos: any[];
  totalPOs: number;
  page: number;
  limit: number;
}

export interface ChinaPOByIdResponse {
  po: any;
}

export interface CreateChinaPOPayload {
  supplierId: string;
  totalAmountCny: number;
  note?: string | null;
  items: {
    lineItemId: string;
    quantity: number;
    unitPriceCny: number;
  }[];
}

export interface UpdateChinaPOPayload {
  status?: string;
  trackingNumber?: string | null;
  note?: string | null;
}

export interface PendingSupplierGroup {
  supplierId: string;
  supplierName: string;
  totalItems: number;
  totalQuantity: number;
  lineItems: any[]; // Chi tiết các OrderLineItem đang PENDING của supplier này
}
