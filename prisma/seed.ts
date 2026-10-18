
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  InvoiceStatus,
} from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is missing");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const invoices = [
  {
    invoiceNumber: "INV-2026-001",
    vendorName: "Northstar Supplies",
    vendorEmail: "billing@northstar.example",
    amount: "1250.00",
    currency: "USD",
    issueDate: new Date("2026-10-01T00:00:00Z"),
    dueDate: new Date("2026-10-31T00:00:00Z"),
    description: "Office equipment and supplies",
    status: InvoiceStatus.PROCESSING,
  },
  {
    invoiceNumber: "INV-2026-002",
    vendorName: "Apex Technologies",
    vendorEmail: "accounts@apex.example",
    amount: "3850.00",
    currency: "USD",
    issueDate: new Date("2026-10-03T00:00:00Z"),
    dueDate: new Date("2026-11-02T00:00:00Z"),
    description: "Software licenses and IT services",
    status: InvoiceStatus.NEEDS_REVIEW,
  },
  {
    invoiceNumber: "INV-2026-003",
    vendorName: "Greenfield Logistics",
    vendorEmail: "finance@greenfield.example",
    amount: "920.50",
    currency: "USD",
    issueDate: new Date("2026-10-05T00:00:00Z"),
    dueDate: new Date("2026-11-04T00:00:00Z"),
    description: "Freight and delivery services",
    status: InvoiceStatus.NEEDS_REVIEW,
  },
  {
    invoiceNumber: "INV-2026-004",
    vendorName: "Summit Office Co.",
    vendorEmail: "invoices@summit.example",
    amount: "675.00",
    currency: "USD",
    issueDate: new Date("2026-09-20T00:00:00Z"),
    dueDate: new Date("2026-10-20T00:00:00Z"),
    description: "Monthly office stationery",
    status: InvoiceStatus.APPROVED,
    reviewedAt: new Date("2026-10-10T12:00:00Z"),
  },
  {
    invoiceNumber: "INV-2026-002",
    vendorName: "Apex Technologies",
    vendorEmail: "accounts@apex.example",
    amount: "3850.00",
    currency: "USD",
    issueDate: new Date("2026-10-03T00:00:00Z"),
    dueDate: new Date("2026-11-02T00:00:00Z"),
    description: "Software licenses and IT services",
    status: InvoiceStatus.NEEDS_REVIEW,
  },
];

async function main() {
  const existingCount = await prisma.invoice.count();

  if (existingCount > 0) {
    console.log(
      `Seed skipped: database already contains ${existingCount} invoices.`,
    );
    return;
  }

  const result = await prisma.invoice.createMany({
    data: invoices,
  });

  console.log(`Successfully seeded ${result.count} invoices.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
