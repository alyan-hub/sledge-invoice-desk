
import Link from "next/link";
import { notFound } from "next/navigation";
import ReviewActions from "@/components/invoices/ReviewActions";
import { prisma } from "@/lib/prisma";
import { Suspense } from "react";
import { connection } from "next/server";
type PageProps = {
  params: Promise<{ id: string }>;
};

function formatMoney(amount: string, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(amount));
}

function formatDate(date: Date | null) {
  if (!date) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function statusStyles(status: string) {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "bg-rose-50 text-rose-700";
    case "NEEDS_REVIEW":
      return "bg-amber-50 text-amber-700";
    default:
      return "bg-blue-50 text-blue-700";
  }
}

async function InvoiceDetailContent({
  params,
}: PageProps) {
  await connection();

  const { id } = await params;

  const invoice = await prisma.invoice.findUnique({
    where: { id },
  });

  if (!invoice) {
    notFound();
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
      id: {
        not: invoice.id,
      },
    },
    select: {
      id: true,
      invoiceNumber: true,
    },
  });

  const isDuplicate = matchingInvoices.length > 0;

  const fields = [
    {
      label: "Invoice number",
      value: invoice.invoiceNumber,
    },
    {
      label: "Vendor",
      value: invoice.vendorName,
    },
    {
      label: "Vendor email",
      value: invoice.vendorEmail ?? "Not provided",
    },
    {
      label: "Issue date",
      value: formatDate(invoice.issueDate),
    },
    {
      label: "Due date",
      value: formatDate(invoice.dueDate),
    },
    {
      label: "Amount",
      value: formatMoney(
        invoice.amount.toString(),
        invoice.currency,
      ),
    },
    {
      label: "Description",
      value: invoice.description ?? "No description",
    },
    {
      label: "Reviewed at",
      value: formatDate(invoice.reviewedAt),
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight"
          >
            Sledge
            <span className="font-normal text-slate-400">
              {" "}
              / Invoice Desk
            </span>
          </Link>

          <span className="text-xs font-medium text-slate-500">
            Invoice details
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <Link
          href="/?tab=review"
          className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
        >
          ← Back to invoices
        </Link>

        <div className="mt-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Invoice details
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight">
              {invoice.invoiceNumber}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Submitted by {invoice.vendorName}
            </p>
          </div>

          <span
            className={`rounded-full px-4 py-2 text-sm font-semibold ${statusStyles(invoice.status)}`}
          >
            {invoice.status.replaceAll("_", " ")}
          </span>
        </div>

        {isDuplicate && (
          <div
            role="alert"
            className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5"
          >
            <h2 className="font-bold text-amber-900">
              Possible duplicate invoice
            </h2>

            <p className="mt-2 text-sm leading-6 text-amber-800">
              Another invoice from this vendor uses the same
              invoice number. Review both records before
              making an approval decision.
            </p>

            <div className="mt-3 flex flex-wrap gap-3">
              {matchingInvoices.map((item) => (
                <Link
                  key={item.id}
                  href={`/invoices/${item.id}`}
                  className="text-sm font-semibold text-amber-900 underline"
                >
                  Compare {item.invoiceNumber} →
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-5">
            <h2 className="text-lg font-bold">
              Invoice information
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Full details of the selected invoice.
            </p>
          </div>

          <dl className="grid gap-x-10 gap-y-7 p-6 sm:grid-cols-2">
            {fields.map((field) => (
              <div key={field.label}>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {field.label}
                </dt>

                <dd className="mt-2 break-words text-sm font-semibold text-slate-900">
                  {field.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

       
{invoice.status === "NEEDS_REVIEW" && (
  <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <h2 className="text-lg font-bold">
      Review decision
    </h2>

    <p className="mt-2 text-sm text-slate-500">
      Review the invoice information before approving
      or rejecting this request.
    </p>

    <div className="mt-5">
      <ReviewActions invoiceId={invoice.id} />
    </div>
  </div>
)}
</main>
</div>
);
}

export default function InvoiceDetailPage(props: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb]">
          <p
            role="status"
            className="text-sm font-medium text-slate-500"
          >
            Loading invoice details...
          </p>
        </main>
      }
    >
      <InvoiceDetailContent {...props} />
    </Suspense>
  );
}

