
import { NextRequest, NextResponse, connection } from "next/server";

import { prisma } from "@/lib/prisma";
import { InvoiceStatus } from "@/generated/prisma/client";

const validStatuses = new Set<string>(
  Object.values(InvoiceStatus),
);

export async function GET(request: NextRequest) {
  await connection();

  try {
    const statusParam = request.nextUrl.searchParams.get("status");

    if (statusParam && !validStatuses.has(statusParam)) {
      return NextResponse.json(
        { error: "Invalid invoice status" },
        { status: 400 },
      );
    }

    const invoices = await prisma.invoice.findMany({
      where: statusParam
        ? { status: statusParam as InvoiceStatus }
        : undefined,
      orderBy: {
        createdAt: "desc",
      },
    });

    const allInvoices = await prisma.invoice.findMany({
      select: {
        vendorName: true,
        invoiceNumber: true,
      },
    });

    const duplicateCounts = new Map<string, number>();

    for (const invoice of allInvoices) {
      const key = JSON.stringify([
        invoice.vendorName.trim().toLowerCase(),
        invoice.invoiceNumber.trim().toLowerCase(),
      ]);

      duplicateCounts.set(
        key,
        (duplicateCounts.get(key) ?? 0) + 1,
      );
    }

    const result = invoices.map((invoice) => {
      const key = JSON.stringify([
        invoice.vendorName.trim().toLowerCase(),
        invoice.invoiceNumber.trim().toLowerCase(),
      ]);

      return {
        ...invoice,
        amount: invoice.amount.toString(),
        isDuplicate: (duplicateCounts.get(key) ?? 0) > 1,
      };
    });

    return NextResponse.json({
      data: result,
      total: result.length,
    });
  } catch (error) {
    console.error("GET /api/invoices failed:", error);

    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 },
    );
  }
}
