
"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ReviewStatus = "APPROVED" | "REJECTED";

type ReviewActionsProps = {
  invoiceId: string;
};

export default function ReviewActions({
  invoiceId,
}: ReviewActionsProps) {
  const router = useRouter();

  const [pendingStatus, setPendingStatus] =
    useState<ReviewStatus | null>(null);

  const [error, setError] = useState<string | null>(null);

  async function handleReview(status: ReviewStatus) {
    if (pendingStatus) return;

    const action = status === "APPROVED" ? "approve" : "reject";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} this invoice?`,
    );

    if (!confirmed) return;

    setPendingStatus(status);
    setError(null);

    try {
      const response = await fetch(
        `/api/invoices/${invoiceId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ status }),
        },
      );

      if (!response.ok) {
        const result = await response.json();

        throw new Error(
          typeof result.error === "string"
            ? result.error
            : "Unable to update invoice",
        );
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );

      setPendingStatus(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => handleReview("APPROVED")}
          disabled={pendingStatus !== null}
          className="rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingStatus === "APPROVED"
            ? "Approving..."
            : "Approve invoice"}
        </button>

        <button
          type="button"
          onClick={() => handleReview("REJECTED")}
          disabled={pendingStatus !== null}
          className="rounded-lg border border-rose-200 bg-white px-5 py-3 text-sm font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pendingStatus === "REJECTED"
            ? "Rejecting..."
            : "Reject invoice"}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
