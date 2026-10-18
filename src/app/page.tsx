
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";

type InvoiceStatus =
  | "PROCESSING"
  | "NEEDS_REVIEW"
  | "APPROVED"
  | "REJECTED";

type Tab = "processing" | "review" | "decided";

type PageProps = {
  searchParams: Promise<{ tab?: string }>;
};

const tabs: {
  id: Tab;
  label: string;
  statuses: InvoiceStatus[];
}[] = [
  {
    id: "processing",
    label: "Processing",
    statuses: ["PROCESSING"],
  },
  {
    id: "review",
    label: "Needs review",
    statuses: ["NEEDS_REVIEW"],
  },
  {
    id: "decided",
    label: "Approved / Rejected",
    statuses: ["APPROVED", "REJECTED"],
  },
];

function formatMoney(amount: string, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(amount));
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function statusLabel(status: InvoiceStatus) {
  const labels: Record<InvoiceStatus, string> = {
    PROCESSING: "Processing",
    NEEDS_REVIEW: "Needs review",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };

  return labels[status];
}

function statusClasses(status: InvoiceStatus) {
  const classes: Record<InvoiceStatus, string> = {
    PROCESSING: "bg-blue-50 text-blue-700 ring-blue-200",
    NEEDS_REVIEW: "bg-amber-50 text-amber-700 ring-amber-200",
    APPROVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    REJECTED: "bg-rose-50 text-rose-700 ring-rose-200",
  };

  return classes[status];
}

async function InvoiceDashboard({ searchParams }: PageProps) {
  await connection();

  const { tab } = await searchParams;
  const activeTab: Tab =
    tab === "review" || tab === "decided"
      ? tab
      : "processing";

  const invoices = await prisma.invoice.findMany({
    orderBy: [
      { createdAt: "desc" },
      { invoiceNumber: "asc" },
    ],
  });

  const duplicateCounts = new Map<string, number>();

  for (const invoice of invoices) {
    const key = JSON.stringify([
      invoice.vendorName.trim().toLowerCase(),
      invoice.invoiceNumber.trim().toLowerCase(),
    ]);

    duplicateCounts.set(
      key,
      (duplicateCounts.get(key) ?? 0) + 1,
    );
  }

  const counts = {
    processing: invoices.filter(
      (invoice) => invoice.status === "PROCESSING",
    ).length,
    review: invoices.filter(
      (invoice) => invoice.status === "NEEDS_REVIEW",
    ).length,
    decided: invoices.filter(
      (invoice) =>
        invoice.status === "APPROVED" ||
        invoice.status === "REJECTED",
    ).length,
  };

  const currentTab = tabs.find(
    (item) => item.id === activeTab,
  )!;

  const visibleInvoices = invoices.filter((invoice) =>
    currentTab.statuses.includes(invoice.status),
  );

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600 text-lg font-bold text-white shadow-sm">
              S
            </div>

            <div>
              <p className="text-lg font-bold tracking-tight">
                Sledge
                <span className="font-normal text-slate-400">
                  {" "}
                  / Invoice Desk
                </span>
              </p>
              <p className="text-xs text-slate-500">
                Accounts payable workspace
              </p>
            </div>
          </div>

          <span className="hidden rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 sm:inline-flex">
            Invoice management
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
        <div className="mb-9">
          <p className="mb-2 text-sm font-semibold text-indigo-600">
            WORKSPACE OVERVIEW
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Invoice approvals
          </h1>

          <p className="mt-3 text-sm text-slate-500 sm:text-base">
            Track incoming invoices, identify duplicates,
            and manage approval decisions in one place.
          </p>
        </div>

        <div className="mb-9 grid gap-4 sm:grid-cols-3">
          {[
            {
              label: "Processing",
              count: counts.processing,
              color: "text-blue-600",
              background: "bg-blue-50",
            },
            {
              label: "Needs review",
              count: counts.review,
              color: "text-amber-600",
              background: "bg-amber-50",
            },
            {
              label: "Approved / Rejected",
              count: counts.decided,
              color: "text-emerald-600",
              background: "bg-emerald-50",
            },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div
                className={`mb-5 flex h-10 w-10 items-center justify-center rounded-xl ${card.background}`}
              >
                <span className={`text-xl ${card.color}`}>
                  ●
                </span>
              </div>

              <p className="text-sm font-medium text-slate-500">
                {card.label}
              </p>

              <p className="mt-2 text-4xl font-bold tracking-tight">
                {card.count}
              </p>
            </div>
          ))}
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-6 pt-6">
            <div className="mb-5">
              <h2 className="text-lg font-bold">
                Invoice queue
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review invoices by their current workflow status.
              </p>
            </div>

            <nav
              aria-label="Invoice status"
              className="flex gap-6 overflow-x-auto"
            >
              {tabs.map((item) => {
                const active = activeTab === item.id;

                return (
                  <Link
                    key={item.id}
                    href={`/?tab=${item.id}`}
                    aria-current={active ? "page" : undefined}
                    className={`shrink-0 border-b-2 pb-4 text-sm font-semibold transition-colors ${
                      active
                        ? "border-indigo-600 text-indigo-600"
                        : "border-transparent text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                    <span
                      className={`ml-2 rounded-md px-2 py-1 text-xs ${
                        active
                          ? "bg-indigo-50 text-indigo-600"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {counts[item.id]}
                    </span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {visibleInvoices.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <p className="font-semibold text-slate-700">
                No invoices found
              </p>
              <p className="mt-2 text-sm text-slate-500">
                There are no invoices in this queue.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">
                      Invoice
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Vendor
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Due date
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Amount
                    </th>
                    <th className="px-6 py-4 font-semibold">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visibleInvoices.map((invoice) => {
                    const duplicateKey = JSON.stringify([
                      invoice.vendorName.trim().toLowerCase(),
                      invoice.invoiceNumber.trim().toLowerCase(),
                    ]);

                    const isDuplicate =
                      (duplicateCounts.get(duplicateKey) ?? 0) > 1;

                    return (
                      <tr
                        key={invoice.id}
                        className="transition-colors hover:bg-slate-50"
                      >
                        <td className="px-6 py-5">
                          <p className="text-sm font-semibold">
                            {invoice.invoiceNumber}
                          </p>

                          {isDuplicate && (
                            <span className="mt-2 inline-flex rounded-md bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700">
                              Possible duplicate
                            </span>
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <p className="text-sm font-medium">
                            {invoice.vendorName}
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            {invoice.vendorEmail ?? "No email"}
                          </p>
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-600">
                          {formatDate(invoice.dueDate)}
                        </td>

                        <td className="px-6 py-5 text-sm font-semibold">
                          {formatMoney(
                            invoice.amount.toString(),
                            invoice.currency,
                          )}
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${statusClasses(invoice.status)}`}
                          >
                            {statusLabel(invoice.status)}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-right">
                          <Link
                            href={`/invoices/${invoice.id}`}
                            className="inline-flex items-center rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700"
                          >
                            View details →
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="border-t border-slate-200 px-6 py-4 text-xs text-slate-500">
            Showing {visibleInvoices.length} of {invoices.length} invoices
          </div>
        </section>

        <footer className="mt-8 text-center text-xs text-slate-400">
          Sledge Invoice Desk · Invoice approval workflow
        </footer>
      </main>
    </div>
  );
}

export default function Home(props: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#f6f8fb]">
          <p
            role="status"
            className="text-sm font-medium text-slate-500"
          >
            Loading invoices...
          </p>
        </main>
      }
    >
      <InvoiceDashboard {...props} />
    </Suspense>
  );
}
