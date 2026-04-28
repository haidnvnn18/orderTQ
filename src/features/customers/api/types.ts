// ============================================================
// Customer API — Type Definitions
// ============================================================

export interface CustomerFilters {
  page?: number;
  limit?: number;
  /** Tìm kiếm theo tên hoặc số điện thoại */
  search?: string;
  /** JSON string: [{id: 'name', desc: false}] */
  sort?: string;
}

export interface CustomerSummary {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  tags: string[];
  depositRate: number;
  notes: string | null;
  clerkUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
  /** Số đơn hàng (đếm realtime từ quan hệ) */
  _count: { orders: number };
}

export interface CustomersResponse {
  customers: CustomerSummary[];
  totalCustomers: number;
  page: number;
  limit: number;
}

export interface CustomerByIdResponse {
  customer: CustomerDetail | null;
}

export interface CustomerDetail {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  tags: string[];
  depositRate: number;
  notes: string | null;
  clerkUserId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerMutationPayload {
  name: string;
  phone: string;
  email?: string | null;
  address?: string | null;
  tags?: string[];
  depositRate?: number;
  notes?: string | null;
}
