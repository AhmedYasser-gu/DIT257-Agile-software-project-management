"use client";
export default function StatusBadge({ status }: { status: string }) {
  const cls =
    status === "AVAILABLE"
      ? "bg-green-50 text-green-700 border-green-200"
      : status === "CLAIMED"
      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
      : status === "PICKEDUP"
      ? "bg-blue-50 text-blue-700 border-blue-200"
      : "bg-gray-50 text-gray-700 border-border";
  return <span className={`text-xs px-2 py-0.5 rounded-full border ${cls}`}>{status}</span>;
}


