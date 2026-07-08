"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type DateFilterProps = {
  defaultFrom: string;
  defaultTo: string;
};

export default function DateFilter({ defaultFrom, defaultTo }: DateFilterProps) {
  const router = useRouter();
  const [fromDate, setFromDate] = useState(defaultFrom);
  const [toDate, setToDate] = useState(defaultTo);

  function handleFilter() {
    if (fromDate && toDate) {
      router.push(`/admin?from=${fromDate}&to=${toDate}`);
    }
  }

  return (
    <div className="flex items-end gap-2">
      <div>
        <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Từ</label>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      <div>
        <label className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">Đến</label>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
      </div>
      <button
        type="button"
        onClick={handleFilter}
        className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 transition"
      >
        Lọc
      </button>
    </div>
  );
}
