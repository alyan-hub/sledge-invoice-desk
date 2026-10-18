
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

// GET /api/invoices/:id
export async function GET(
  _request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 },
      );
    }

    const matchingInvoices = await prisma.invoice.findMany({
      where: {
        vendorName: {
          equals: invoice.vendorName,
          mode: "insensitive",
        },
        invoiceNumber: {
          equals: invoice.invoiceNumber,
          mode: "insensitive",
        },
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({
      data: {
        ...invoice,
        amount: invoice.amount.toString(),
        isDuplicate: matchingInvoices.length > 1,
        duplicateInvoiceIds: matchingInvoices
          .filter((item) => item.id !== invoice.id)
          .map((item) => item.id),
      },
    });
  } catch (error) {
    console.error("GET invoice details failed:", error);

    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 },
    );
  }
}

// PATCH /api/invoices/:id
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request body" },
        { status: 400 },
      );
    }

    if (
      typeof body !== "object" ||
      body === null ||
      !("status" in body) ||
      (body.status !== "APPROVED" &&
        body.status !== "REJECTED")
    ) {
      return NextResponse.json(
        { error: "Status must be APPROVED or REJECTED" },
        { status: 400 },
      );
    }

    // Atomic update prevents conflicting review actions.
    const updated = await prisma.invoice.updateMany({
      where: {
        id,
        status: "NEEDS_REVIEW",
      },
      data: {
        status: body.status,
        reviewedAt: new Date(),
      },
    });

    if (updated.count === 0) {
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        select: { id: true },
      });

      return NextResponse.json(
        {
          error: invoice
            ? "Only invoices needing review can be approved or rejected"
            : "Invoice not found",
        },
        { status: invoice ? 409 : 404 },
      );
    }

    const updatedInvoice =
      await prisma.invoice.findUniqueOrThrow({
        where: { id },
      });

    return NextResponse.json({
      data: {
        ...updatedInvoice,
        amount: updatedInvoice.amount.toString(),
      },
      message: `Invoice ${body.status.toLowerCase()} successfully`,
    });
  } catch (error) {
    console.error("PATCH invoice status failed:", error);

    return NextResponse.json(
      { error: "Failed to update invoice status" },
      { status: 500 },
    );
  }
}
