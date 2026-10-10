"use client";

import Link from "next/link";
import { useState } from "react";
import { DownloadIcon, PencilIcon, SearchIcon, TrashIcon } from "@/components/icons";
import { useTracker } from "@/components/TrackerProvider";
import {
  buttonStyles,
  Card,
  EmptyState,
  inputStyles,
  linkStyles,
  LoadingState,
  PageHeader,
} from "@/components/ui";
import { downloadCsv, formatDate, plural, sum, todayInputValue } from "@/lib/format";
import type { Order, OrderDispatch } from "@/lib/types";

type DispatchRow = { order: Order; dispatch: OrderDispatch };

function matchesSearch({ order, dispatch }: DispatchRow, query: string) {
  if (!query) return true;
  const haystack = [
    dispatch.internalGpNo,
    dispatch.dispatchTo,
    dispatch.remarks,
    `#${order.sno}`,
    order.companyName,
    order.slipRingType,
    order.clientGpNo,
  ]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((term) => haystack.includes(term));
}

function exportDispatches(rows: DispatchRow[]) {
  downloadCsv(
    `dispatches-${todayInputValue()}.csv`,
    [
      "Dispatch date",
      "Internal GP no.",
      "Company",
      "Slip ring type",
      "Drums",
      "Dispatched to",
      "Order no.",
      "Client GP no.",
      "Remarks",
    ],
    rows.map(({ order, dispatch }) => [
      dispatch.dispatchDate.slice(0, 10),
      dispatch.internalGpNo,
      order.companyName,
      order.slipRingType,
      dispatch.dispatchQty,
      dispatch.dispatchTo,
      order.sno,
      order.clientGpNo,
      dispatch.remarks,
    ]),
  );
}

export function DispatchesView() {
  const { data, loadError, openModal, deleteDispatch } = useTracker();
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("");

  if (!data) return <LoadingState error={loadError} />;

  const allRows: DispatchRow[] = data.orders.flatMap((order) =>
    order.dispatches.map((dispatch) => ({ order, dispatch })),
  );
  const rows = allRows
    .filter(
      (row) =>
        (!company || row.order.companyName === company) && matchesSearch(row, query.trim()),
    )
    .sort(
      (a, b) =>
        b.dispatch.dispatchDate.localeCompare(a.dispatch.dispatchDate) ||
        b.dispatch.id - a.dispatch.id,
    );
  const totalDrums = sum(rows.map((row) => row.dispatch.dispatchQty));

  return (
    <>
      <PageHeader
        title="Dispatches"
        description="Every drum that has left the workshop, newest first."
        actions={
          <button
            type="button"
            onClick={() => exportDispatches(rows)}
            disabled={rows.length === 0}
            className={buttonStyles.secondary}
          >
            <DownloadIcon />
            Export CSV
          </button>
        }
      />

      <Card flush>
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center">
          <p className="text-slate-500 sm:mr-auto">
            <span className="font-semibold text-slate-900">{plural(rows.length, "dispatch")}</span>
            {" · "}
            {plural(totalDrums, "drum")}
          </p>
          <div className="relative sm:w-72">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search dispatches…"
              className={`${inputStyles} pl-9`}
            />
          </div>
          <select
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            className={`${inputStyles} sm:w-48`}
            aria-label="Filter by company"
          >
            <option value="">All companies</option>
            {data.companies.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            title={allRows.length === 0 ? "No dispatches yet" : "No dispatches match"}
            description={
              allRows.length === 0
                ? "Dispatch drums from an open order to see them here."
                : "Try a different search or company."
            }
          />
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
                    <th className="px-4 py-2.5 font-medium">Date</th>
                    <th className="px-4 py-2.5 font-medium">Internal GP</th>
                    <th className="px-4 py-2.5 font-medium">Company</th>
                    <th className="px-4 py-2.5 font-medium">Slip ring type</th>
                    <th className="px-4 py-2.5 text-right font-medium">Drums</th>
                    <th className="px-4 py-2.5 font-medium">Dispatched to</th>
                    <th className="px-4 py-2.5 font-medium">Order</th>
                    <th className="px-4 py-2.5 font-medium">Remarks</th>
                    <th className="px-4 py-2.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map(({ order, dispatch }) => (
                    <tr key={dispatch.id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-4 py-3">{formatDate(dispatch.dispatchDate)}</td>
                      <td className="whitespace-nowrap px-4 py-3 font-medium">{dispatch.internalGpNo}</td>
                      <td className="px-4 py-3">{order.companyName ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3">{order.slipRingType}</td>
                      <td className="px-4 py-3 text-right font-medium tabular-nums">
                        {dispatch.dispatchQty}
                      </td>
                      <td className="px-4 py-3">{dispatch.dispatchTo}</td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <Link href={`/orders/${order.id}`} className={linkStyles}>
                          #{order.sno}
                        </Link>
                      </td>
                      <td className="max-w-56 truncate px-4 py-3 text-slate-500">
                        {dispatch.remarks || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            title="Edit dispatch"
                            aria-label={`Edit dispatch ${dispatch.internalGpNo}`}
                            onClick={() => openModal({ kind: "editDispatch", order, dispatch })}
                            className={buttonStyles.icon}
                          >
                            <PencilIcon />
                          </button>
                          <button
                            type="button"
                            title="Delete dispatch"
                            aria-label={`Delete dispatch ${dispatch.internalGpNo}`}
                            onClick={() => deleteDispatch(order, dispatch)}
                            className={buttonStyles.iconDanger}
                          >
                            <TrashIcon />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {rows.map(({ order, dispatch }) => (
                <li key={dispatch.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        <span className="text-blue-700">{dispatch.internalGpNo}</span>{" "}
                        {order.companyName ?? "—"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {order.slipRingType} · To {dispatch.dispatchTo} · {formatDate(dispatch.dispatchDate)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                      {dispatch.dispatchQty}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      Order <Link href={`/orders/${order.id}`} className={linkStyles}>#{order.sno}</Link>
                    </p>
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => openModal({ kind: "editDispatch", order, dispatch })}
                        className={buttonStyles.icon}
                      >
                        <PencilIcon />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDispatch(order, dispatch)}
                        className={buttonStyles.iconDanger}
                      >
                        <TrashIcon />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </Card>
    </>
  );
}
