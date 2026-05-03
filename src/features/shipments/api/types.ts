import { BatchStatus, LineItemStatus } from '@prisma/client';

export interface ShipmentBatchFilters {
  page?: number;
  limit?: number;
  search?: string; // Tên lô, tracking TQ/VN
  status?: BatchStatus | 'all';
  sort?: string;
}

export interface ShipmentBatchListItem {
  id: string;
  batchCode: string;
  status: BatchStatus;
  cnTrackingNumber: string | null;
  vnTrackingNumber: string | null;
  totalWeightKg: number | null;
  totalVolumeM3: number | null;
  shippingFeeTotal: number;
  createdAt: Date;
  _count: {
    batchItems: number;
  };
}

export interface ShipmentBatchListResponse {
  batches: ShipmentBatchListItem[];
  totalBatches: number;
  page: number;
  limit: number;
}

export interface ShipmentBatchItemDetail {
  id: string;
  shipmentBatchId: string;
  lineItemId: string;
  quantity: number;
  expectedQuantity: number;
  discrepancyNote: string | null;
  lineItem: {
    id: string;
    historicalName: string;
    historicalSku: string;
    historicalImageUrl: string | null;
    status: LineItemStatus;
    order: {
      id: string;
      orderNumber: string;
      customer: {
        id: string;
        name: string;
      } | null;
    };
  };
}

export interface ShipmentBatchDetail {
  id: string;
  batchCode: string;
  status: BatchStatus;
  cnTrackingNumber: string | null;
  vnTrackingNumber: string | null;
  totalWeightKg: number | null;
  totalVolumeM3: number | null;
  shippingFeeTotal: number;
  notes: string | null;
  arrivedAtCnAt: Date | null;
  arrivedAtVnAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  batchItems: ShipmentBatchItemDetail[];
}

export interface ShipmentBatchByIdResponse {
  batch: ShipmentBatchDetail | null;
}

export interface CreateShipmentBatchPayload {
  cnTrackingNumber?: string;
  vnTrackingNumber?: string;
  notes?: string;
}

export interface UpdateShipmentBatchPayload {
  status?: BatchStatus;
  cnTrackingNumber?: string;
  vnTrackingNumber?: string;
  totalWeightKg?: number;
  totalVolumeM3?: number;
  shippingFeeTotal?: number;
  notes?: string;
}

export interface AddItemsToBatchPayload {
  lineItemIds: string[];
}

export interface UpdateBatchItemPayload {
  quantity: number;
  discrepancyNote?: string;
}

// Picker line item
export interface PickerLineItem {
  id: string;
  historicalName: string;
  historicalSku: string;
  historicalImageUrl: string | null;
  quantity: number;
  status: LineItemStatus;
  chinaPoLineItem?: {
    chinaPo: {
      poNumber: string;
      supplier?: {
        id: string;
        name: string;
      } | null;
    };
  } | null;
  order: {
    orderNumber: string;
  };
}
