-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('DRAFT', 'DEPOSITED', 'PURCHASED', 'WAREHOUSE_CN', 'WAREHOUSE_VN', 'DELIVERING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "FinancialStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'REFUNDED');

-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('PACKING', 'IN_TRANSIT', 'ARRIVED_VN', 'DISTRIBUTED');

-- CreateTable
CREATE TABLE "exchange_rate_logs" (
    "id" UUID NOT NULL,
    "rateCnyVnd" DECIMAL(10,2) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exchange_rate_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "depositRate" INTEGER NOT NULL DEFAULT 30,
    "notes" TEXT,
    "clerkUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "suppliers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "platformUrl" TEXT,
    "contactInfo" TEXT,
    "reliabilityScore" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "products" (
    "id" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "basePriceCny" DECIMAL(10,2) NOT NULL,
    "images" JSONB NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "product_variants" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "sku" TEXT NOT NULL,
    "attributes" JSONB NOT NULL,
    "priceAdjustmentCny" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "variantImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipment_batches" (
    "id" UUID NOT NULL,
    "batchCode" TEXT NOT NULL,
    "status" "BatchStatus" NOT NULL DEFAULT 'PACKING',
    "cnTrackingNumber" TEXT,
    "vnTrackingNumber" TEXT,
    "totalWeightKg" DECIMAL(8,2),
    "totalVolumeM3" DECIMAL(8,4),
    "shippingFeeTotal" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "arrivedAtCnAt" TIMESTAMP(3),
    "arrivedAtVnAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shipment_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" UUID NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "customerId" UUID NOT NULL,
    "shipmentBatchId" UUID,
    "status" "OrderStatus" NOT NULL DEFAULT 'DRAFT',
    "financialStatus" "FinancialStatus" NOT NULL DEFAULT 'PENDING',
    "exchangeRate" DECIMAL(10,2) NOT NULL,
    "totalAmountVnd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "depositAmountVnd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paidAmountVnd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "shippingFeeVnd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "serviceFeeVnd" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "chinaTrackingNumber" TEXT,
    "internalNote" TEXT,
    "customerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_line_items" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "variantId" UUID,
    "quantity" INTEGER NOT NULL,
    "historicalPriceCny" DECIMAL(10,2) NOT NULL,
    "historicalPriceVnd" DECIMAL(12,2) NOT NULL,
    "historicalSku" TEXT NOT NULL,
    "historicalName" TEXT NOT NULL,
    "historicalImageUrl" TEXT,

    CONSTRAINT "order_line_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "amountVnd" DECIMAL(12,2) NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'cash',
    "note" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_status_logs" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "oldStatus" "OrderStatus",
    "newStatus" "OrderStatus" NOT NULL,
    "clerkUserId" TEXT,
    "changedByName" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_status_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exchange_rate_logs_createdAt_idx" ON "exchange_rate_logs"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "customers_phone_key" ON "customers"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "customers_clerkUserId_key" ON "customers"("clerkUserId");

-- CreateIndex
CREATE INDEX "customers_phone_idx" ON "customers"("phone");

-- CreateIndex
CREATE INDEX "customers_name_idx" ON "customers"("name");

-- CreateIndex
CREATE INDEX "customers_clerkUserId_idx" ON "customers"("clerkUserId");

-- CreateIndex
CREATE INDEX "suppliers_reliabilityScore_idx" ON "suppliers"("reliabilityScore");

-- CreateIndex
CREATE INDEX "products_supplierId_idx" ON "products"("supplierId");

-- CreateIndex
CREATE INDEX "products_isActive_idx" ON "products"("isActive");

-- CreateIndex
CREATE INDEX "products_title_idx" ON "products"("title");

-- CreateIndex
CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");

-- CreateIndex
CREATE INDEX "product_variants_productId_idx" ON "product_variants"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "shipment_batches_batchCode_key" ON "shipment_batches"("batchCode");

-- CreateIndex
CREATE INDEX "shipment_batches_status_idx" ON "shipment_batches"("status");

-- CreateIndex
CREATE INDEX "shipment_batches_cnTrackingNumber_idx" ON "shipment_batches"("cnTrackingNumber");

-- CreateIndex
CREATE INDEX "shipment_batches_vnTrackingNumber_idx" ON "shipment_batches"("vnTrackingNumber");

-- CreateIndex
CREATE UNIQUE INDEX "orders_orderNumber_key" ON "orders"("orderNumber");

-- CreateIndex
CREATE INDEX "orders_customerId_idx" ON "orders"("customerId");

-- CreateIndex
CREATE INDEX "orders_status_idx" ON "orders"("status");

-- CreateIndex
CREATE INDEX "orders_financialStatus_idx" ON "orders"("financialStatus");

-- CreateIndex
CREATE INDEX "orders_shipmentBatchId_idx" ON "orders"("shipmentBatchId");

-- CreateIndex
CREATE INDEX "orders_chinaTrackingNumber_idx" ON "orders"("chinaTrackingNumber");

-- CreateIndex
CREATE INDEX "orders_createdAt_idx" ON "orders"("createdAt");

-- CreateIndex
CREATE INDEX "order_line_items_orderId_idx" ON "order_line_items"("orderId");

-- CreateIndex
CREATE INDEX "order_line_items_variantId_idx" ON "order_line_items"("variantId");

-- CreateIndex
CREATE INDEX "payments_orderId_idx" ON "payments"("orderId");

-- CreateIndex
CREATE INDEX "payments_paidAt_idx" ON "payments"("paidAt");

-- CreateIndex
CREATE INDEX "order_status_logs_orderId_idx" ON "order_status_logs"("orderId");

-- CreateIndex
CREATE INDEX "order_status_logs_createdAt_idx" ON "order_status_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "products" ADD CONSTRAINT "products_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_variants" ADD CONSTRAINT "product_variants_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_shipmentBatchId_fkey" FOREIGN KEY ("shipmentBatchId") REFERENCES "shipment_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_line_items" ADD CONSTRAINT "order_line_items_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "product_variants"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_status_logs" ADD CONSTRAINT "order_status_logs_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;
