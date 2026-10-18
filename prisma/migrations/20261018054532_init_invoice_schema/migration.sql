-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PROCESSING', 'NEEDS_REVIEW', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "vendorEmail" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "issueDate" DATE NOT NULL,
    "dueDate" DATE NOT NULL,
    "description" TEXT,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PROCESSING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE INDEX "Invoice_vendorName_invoiceNumber_idx" ON "Invoice"("vendorName", "invoiceNumber");
