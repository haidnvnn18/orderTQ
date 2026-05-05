# OrderTQ — Mini ERP Admin Dashboard

Hệ thống quản lý đơn hàng B2B (Wholesale) dành cho nghiệp vụ nhập hàng Trung Quốc về Việt Nam.

---

## Tech Stack

| Layer | Công nghệ |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | Supabase PostgreSQL |
| **ORM** | Prisma |
| **Auth** | Clerk |
| **State / Data Fetching** | TanStack Query v5 |
| **Form / Validation** | Zod (manual state, không dùng react-hook-form) |
| **URL State** | nuqs |
| **Image Storage** | Supabase Storage (CDN public bucket) |

---

## Kiến trúc Tổng quan

```
src/
├── app/                        # Next.js App Router (Routes)
│   ├── dashboard/
│   │   ├── overview/           # Dashboard tổng quan
│   │   ├── order/              # ✅ Quản lý đơn hàng
│   │   │   ├── page.tsx        # Danh sách đơn hàng
│   │   │   ├── new/page.tsx    # Tạo đơn mới
│   │   │   └── [orderId]/page.tsx  # Chi tiết đơn
│   │   ├── product/            # ✅ Quản lý sản phẩm
│   │   │   ├── page.tsx
│   │   │   └── [productId]/page.tsx
│   │   ├── customer/           # ✅ Quản lý khách hàng
│   │   │   ├── page.tsx
│   │   │   └── [customerId]/page.tsx
│   │   └── users/
│   └── api/                    # API routes (nếu cần)
│
├── features/                   # Feature-based modules (Pattern chính)
│   ├── orders/
│   │   ├── api/
│   │   │   ├── service.ts      # Server Actions: CRUD logic (Prisma)
│   │   │   ├── queries.ts      # TanStack Query queryOptions
│   │   │   ├── mutations.ts    # TanStack Query mutationOptions
│   │   │   ├── picker-service.ts  # Lấy data cho form picker (Products, Customers)
│   │   │   └── types.ts        # TypeScript interfaces
│   │   ├── components/
│   │   │   ├── order-listing.tsx       # SSR prefetch + HydrationBoundary
│   │   │   ├── order-form.tsx          # Master-detail form tạo đơn
│   │   │   ├── order-detail-page.tsx   # Trang chi tiết + timeline + status update
│   │   │   └── order-tables/
│   │   │       ├── index.tsx           # DataTable component
│   │   │       ├── columns.tsx         # Column definitions
│   │   │       └── cell-action.tsx     # Row action menu
│   │   └── schemas/
│   │       └── order.ts        # Zod validation schema
│   │
│   ├── products/               # ✅ Tương tự pattern trên
│   └── customers/              # ✅ Tương tự pattern trên
│
├── components/
│   ├── layout/
│   │   └── page-container.tsx  # Wrapper layout cho tất cả pages
│   ├── ui/                     # shadcn/ui components
│   │   └── table/              # DataTable, DataTableToolbar, Pagination, ...
│   ├── icons.tsx               # Tập trung toàn bộ icon (@tabler/icons-react)
│   └── modal/
│       └── alert-modal.tsx     # Confirm dialog dùng chung
│
├── config/
│   └── nav-config.ts           # Cấu hình sidebar navigation
│
├── lib/
│   ├── prisma.ts               # Prisma client singleton
│   ├── query-client.ts         # TanStack Query client
│   ├── searchparams.ts         # nuqs searchParams definitions
│   └── parsers.ts              # nuqs getSortingStateParser
│
├── hooks/
│   └── use-data-table.ts       # Hook quản lý DataTable state
│
└── types/
    └── index.ts                # Global types (NavGroup, NavItem, ...)
```

---

## Database Schema (Prisma)

File: `prisma/schema.prisma` — PostgreSQL trên Supabase.

### Enums

| Enum | Mục đích |
|------|---------|
| `OrderStatus` | DRAFT → DEPOSITED → PURCHASED → WAREHOUSE_CN → WAREHOUSE_VN → DELIVERING → COMPLETED / CANCELLED |
| `FinancialStatus` | PENDING → PARTIALLY_PAID → PAID / REFUNDED |
| `BatchStatus` | PACKING → IN_TRANSIT → ARRIVED_VN → DISTRIBUTED |
| `LineItemStatus` | PENDING → ORDERED → PRODUCING → READY_CN → IN_TRANSIT → ARRIVED_VN → DELIVERED |
| `ChinaPOStatus` | DRAFT → SENT → CONFIRMED → PRODUCING → READY → SHIPPED → COMPLETED |
| `DeliveryStatus` | PACKING → SHIPPED → DELIVERED / RETURNED |
| `ReturnReason` | DEFECTIVE, WRONG_ITEM, WRONG_SIZE, CUSTOMER_CHANGE, OTHER |
| `ReturnStatus` | REQUESTED → APPROVED → RECEIVED → REFUNDED / REJECTED |

### Models & Quan hệ

```
Customer ──< Order ──< OrderLineItem >── ProductVariant ──< Product >── Supplier
                  ──< Payment
                  ──< OrderStatusLog
                  ──< CustomerDelivery ──< CustomerDeliveryItem >── OrderLineItem
                                                                ──< ReturnItem

ShipmentBatch ──< ShipmentBatchItem >── OrderLineItem

ChinaPurchaseOrder ──< ChinaPOLineItem >── OrderLineItem
ChinaPurchaseOrder >── Supplier
```

### Key Design Decisions

- **Made-to-Order**: Không có field `stock` trên Product/Variant. Số lượng chỉ tồn tại ở `OrderLineItem`.
- **Snapshot Pattern**: `OrderLineItem` lưu `historicalPriceCny`, `historicalPriceVnd`, `historicalSku`, `historicalName` — không phụ thuộc dữ liệu gốc sau khi tạo đơn.
- **Derived Status**: `Order.status` tính từ `LineItemStatus` (PARTIAL_FULFILLMENT khi 1 phần đã giao). Không set thủ công mà đi qua `updateOrderStatus` + ghi `OrderStatusLog`.
- **fulfilledQuantity**: Được update qua transaction khi tạo `CustomerDeliveryItem`. Giảm khi `ReturnItem.status = RECEIVED`.

---

## Feature Patterns (Conventions)

### 1. Data Fetching Pattern

```
RSC Page → prefetchQuery → HydrationBoundary
                                     ↓
                              Client Component → useSuspenseQuery
```

- `service.ts`: `'use server'` — chứa toàn bộ Prisma logic. Gọi trực tiếp từ RSC hoặc từ TanStack mutation.
- `queries.ts`: `queryOptions(...)` — dùng cho `prefetchQuery` (server) và `useSuspenseQuery` (client).
- `mutations.ts`: `mutationOptions(...)` — dùng trong `useMutation`, tự `invalidateQueries` sau success.

### 2. Server Action vs API Route

Dùng **Server Actions** (`'use server'`) cho tất cả CRUD — **không** dùng `/api/` route trừ webhook.

### 3. Form Pattern

- Không dùng `react-hook-form`. State quản lý bằng `useState`.
- Validate với Zod `schema.safeParse(...)` trước khi gọi mutation.
- Toast với `sonner`.

### 4. URL State / Filters

Dùng `nuqs` qua `searchParamsCache` (server) và `useQueryStates` (client).

Tất cả search params định nghĩa tập trung tại `src/lib/searchparams.ts`.

### 5. Navigation

Tất cả sidebar items cấu hình tại `src/config/nav-config.ts`.

Icon map tập trung tại `src/components/icons.tsx` (dùng `@tabler/icons-react`).

---

## Trạng thái Triển khai

### ✅ Đã hoàn thành

| Module | Routes | Ghi chú |
|--------|--------|---------|
| **Dashboard** | `/dashboard/overview` | Dashboard tổng quan với các chỉ số thực tế từ DB |
| **Products** | `/dashboard/product` + `[productId]` | Listing, form tạo/sửa, bulk import (ImportJob) |
| **Customers** | `/dashboard/customer` + `[customerId]` | Listing, form tạo/sửa |
| **Orders — Giai đoạn 1** | `/dashboard/order` + `new` + `[orderId]` | Listing, tạo đơn, chi tiết, timeline, cập nhật status |
| **Payments — Giai đoạn 2** | `/dashboard/order/[orderId]` | Ghi nhận thanh toán, tự cập nhật `financialStatus` |
| **China POs — Giai đoạn 3** | `/dashboard/china-po` | Gom `OrderLineItem` PENDING → tạo đơn TQ |
| **Shipment Batches — Giai đoạn 4** | `/dashboard/shipment-batch` | Tạo batch, track hàng về VN, đối soát số lượng |
| **Deliveries & Returns — Giai đoạn 5** | `/dashboard/delivery` | Giao hàng cho khách VN, xử lý hoàn trả |

### 🔜 Giai đoạn kế tiếp

- Hoàn thiện UI/UX, tối ưu trải nghiệm người dùng
- Deploy lên môi trường staging/production để đối tác chạy test
- Hỗ trợ và nhận feedback từ người dùng
---

## Environment Variables

File: `.env` (root của project)

```env
# Prisma / Supabase
DATABASE_URL=...
DIRECT_URL=...

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/auth/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/auth/sign-up

# Supabase Storage (Image upload)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

---

## Dev Commands

> ⚠️ **Quy tắc**: Không chạy lệnh tự động. Đưa lệnh cho user tự chạy, hỏi khi nào xong mới tiếp tục.

```bash
# Chạy dev server
npm run dev

# Sinh Prisma client sau khi sửa schema
npx prisma generate

# Tạo migration mới
npx prisma migrate dev --name "tên_migration"

# Xem DB trực quan
npx prisma studio

# Kiểm tra trạng thái migration
npx prisma migrate status
```

---

## Migration History

| Migration | Nội dung |
|-----------|---------|
| `20260420221759_init_database` | Schema ban đầu: Customer, Order, Product, Supplier, ShipmentBatch |
| `20260421153032_init_import_job` | Thêm `ImportJob`, sửa `supplierId` nullable |
| `phase1_multi_batch_fulfillment` | Toàn bộ schema mới: LineItemStatus, ChinaPO, CustomerDelivery, ReturnItem, ShipmentBatchItem; xóa `orders.shipmentBatchId` |

---

## Ghi chú AI Assistant

- **Không tự chạy terminal** — luôn đưa lệnh để user tự chạy.
- Khi bắt đầu session mới về dự án này, đọc file này trước để không cần khám phá lại cấu trúc.
- Implementation Plan chi tiết: `IMPLEMENTATION_PLAN.md` (schema DB) và artifact trong brain conversation `48ab48c9` và `04f7cbcf`.
- Decimal từ Prisma cần `.toNumber()` trước khi serialize sang JSON (Next.js Server Action gotcha).
- Dùng `as any[]` khi return Prisma result có `include` phức tạp (tránh type conflict với Decimal).
