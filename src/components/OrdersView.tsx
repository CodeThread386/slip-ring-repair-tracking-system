"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { DownloadIcon, PencilIcon, PlusIcon, SearchIcon, TrashIcon } from "@/components/icons";
import { useTracker } from "@/components/TrackerProvider";
import {
  buttonStyles,
  Card,
  EmptyState,
  inputStyles,
  linkStyles,
  LoadingState,
  PageHeader,
  ProgressBar,
  StageBadge,
} from "@/components/ui";
import {
  daysSince,
  downloadCsv,
  formatDate,
  orderStage,
  stageLabel,
  todayInputValue,
} from "@/lib/format";
import type { Order } from "@/lib/types";

type StatusFilter = "all" | "open" | "completed";
type SortOrder = "newest" | "oldest";

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "completed", label: "Completed" },
];

function matchesSearch(order: Order, query: string) {
  if (!query) return true;
  const haystack = [
    `#${order.sno}`,
    order.companyName,
    order.slipRingType,
    order.clientGpNo,
    order.lrNo,
    order.location,
    order.remarks,
    ...order.dispatches.flatMap((dispatch) => [dispatch.internalGpNo, dispatch.dispatchTo]),
  ]
    .join(" ")
    .toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((term) => haystack.includes(term));
}

function exportOrders(orders: Order[]) {
  downloadCsv(
    `orders-${todayInputValue()}.csv`,
    [
      "Order no.",
      "Received on",
      "Company",
      "Slip ring type",
      "Client GP no.",
      "L.R. no.",
      "Location",
      "Received",
      "Dispatched",
      "In stock",
      "Status",
      "Remarks",
    ],
    orders.map((order) => [
      order.sno,
      order.clientGpDate.slice(0, 10),
      order.companyName,
      order.slipRingType,
      order.clientGpNo,
      order.lrNo,
      order.location,
      order.qtyReceived,
      order.totalDispatched,
      order.effectiveDue,
      stageLabel[orderStage(order)],
      order.remarks,
    ]),
  );
}

function OrderActions({ order }: { order: Order }) {
  const { openModal, deleteOrder } = useTracker();
  return (
    <div className="flex items-center justify-end gap-1" onClick={(event) => event.stopPropagation()}>
      {order.status === "PENDING" && (
        <button
          type="button"
          onClick={() => openModal({ kind: "dispatch", order })}
          className={buttonStyles.small}
        >
          Dispatch
        </button>
      )}
      <button
        type="button"
        title="Edit order"
        aria-label={`Edit order #${order.sno}`}
        onClick={() => openModal({ kind: "editOrder", order })}
        className={buttonStyles.icon}
      >
        <PencilIcon />
      </button>
      <button
        type="button"
        title="Delete order"
        aria-label={`Delete order #${order.sno}`}
        onClick={() => deleteOrder(order)}
        className={buttonStyles.iconDanger}
      >
        <TrashIcon />
      </button>
    </div>
  );
}

export function OrdersView() {
  const { data, loadError, openModal } = useTracker();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>(() => {
    const initial = searchParams.get("status");
    return initial === "open" || initial === "completed" ? initial : "all";
  });
  const [company, setCompany] = useState(searchParams.get("company") ?? "");
  const [type, setType] = useState("");
  const [sort, setSort] = useState<SortOrder>("newest");

  if (!data) return <LoadingState error={loadError} />;

  const base = data.orders.filter(
    (order) =>
      (!company || order.companyName === company) &&
      (!type || order.slipRingType === type) &&
      matchesSearch(order, query.trim()),
  );
  const counts: Record<StatusFilter, number> = {
    all: base.length,
    open: base.filter((order) => order.status === "PENDING").length,
    completed: base.filter((order) => order.status === "CLEARED").length,
  };
  const orders = base
    .filter(
      (order) =>
        status === "all" ||
        (status === "open" ? order.status === "PENDING" : order.status === "CLEARED"),
    )
    .sort((a, b) =>
      sort === "newest"
        ? b.clientGpDate.localeCompare(a.clientGpDate) || b.sno - a.sno
        : a.clientGpDate.localeCompare(b.clientGpDate) || a.sno - b.sno,
    );
  const filtersActive = Boolean(query || company || type);

  return (
    <>
      <PageHeader
        title="Orders"
        description="Every receiving is an order, tracked until all its drums are dispatched."
        actions={
          <button
            type="button"
            onClick={() => exportOrders(orders)}
            disabled={orders.length === 0}
            className={buttonStyles.secondary}
          >
            <DownloadIcon />
            Export CSV
          </button>
        }
      />

      <Card flush>
        <div className="flex flex-col gap-3 border-b border-slate-200 px-4 py-3 lg:flex-row lg:items-center">
          <div className="flex flex-wrap gap-1 rounded-md bg-slate-100 p-1">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatus(tab.value)}
                className={`flex-1 rounded px-3 py-1 text-sm font-medium transition-colors lg:flex-none ${
                  status === tab.value
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-xs tabular-nums text-slate-400">
                  {counts[tab.value]}
                </span>
              </button>
            ))}
          </div>
          <div className="grid flex-1 gap-2 sm:grid-cols-2 lg:flex lg:justify-end">
            <div className="relative sm:col-span-2 lg:w-72">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search orders…"
                className={`${inputStyles} pl-9`}
              />
            </div>
            <select
              value={company}
              onChange={(event) => setCompany(event.target.value)}
              className={`${inputStyles} lg:w-44`}
              aria-label="Filter by company"
            >
              <option value="">All companies</option>
              {data.companies.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={type}
              onChange={(event) => setType(event.target.value)}
              className={`${inputStyles} lg:w-44`}
              aria-label="Filter by slip ring type"
            >
              <option value="">All types</option>
              {data.slipRingTypes.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortOrder)}
              className={`${inputStyles} sm:col-span-2 lg:w-36`}
              aria-label="Sort orders"
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
            </select>
          </div>
        </div>

        {orders.length === 0 ? (
          <EmptyState
            title={data.orders.length === 0 ? "No orders yet" : "No orders match"}
            description={
              data.orders.length === 0
                ? "Log the first receiving to start tracking."
                : "Try a different search or filter."
            }
            action={
              data.orders.length === 0 ? (
                <button
                  type="button"
                  onClick={() => openModal({ kind: "receive" })}
                  className={buttonStyles.primary}
                >
                  <PlusIcon />
                  New receiving
                </button>
              ) : filtersActive ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setCompany("");
                    setType("");
                  }}
                  className={buttonStyles.secondary}
                >
                  Clear filters
                </button>
              ) : undefined
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
                    <th className="px-4 py-2.5 font-medium">Order</th>
                    <th className="px-4 py-2.5 font-medium">Received</th>
                    <th className="px-4 py-2.5 font-medium">Company</th>
                    <th className="px-4 py-2.5 font-medium">Slip ring type</th>
                    <th className="px-4 py-2.5 font-medium">Client GP</th>
                    <th className="px-4 py-2.5 font-medium">L.R. no.</th>
                    <th className="w-44 px-4 py-2.5 font-medium">Dispatched</th>
                    <th className="px-4 py-2.5 font-medium">Status</th>
                    <th className="px-4 py-2.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => {
                    const stage = orderStage(order);
                    return (
                      <tr
                        key={order.id}
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="cursor-pointer hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/orders/${order.id}`}
                            onClick={(event) => event.stopPropagation()}
                            className={linkStyles}
                          >
                            #{order.sno}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">
                          <p>{formatDate(order.clientGpDate)}</p>
                          {stage !== "completed" && (
                            <p className="text-xs text-slate-500">
                              {daysSince(order.clientGpDate)}d in workshop
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium">{order.companyName ?? "—"}</td>
                        <td className="whitespace-nowrap px-4 py-3">{order.slipRingType}</td>
                        <td className="px-4 py-3">
                          <p>{order.clientGpNo}</p>
                          <p className="text-xs text-slate-500">{order.location}</p>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3">{order.lrNo || "—"}</td>
                        <td className="px-4 py-3">
                          <ProgressBar value={order.totalDispatched} max={order.qtyReceived} />
                          <p className="mt-1 text-xs tabular-nums text-slate-500">
                            {order.totalDispatched} of {order.qtyReceived} dispatched
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <StageBadge stage={stage} />
                        </td>
                        <td className="px-4 py-3">
                          <OrderActions order={order} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {orders.map((order) => (
                <li key={order.id} className="px-4 py-4">
                  <Link href={`/orders/${order.id}`} className="block">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium">
                          <span className="text-blue-700">#{order.sno}</span>{" "}
                          {order.companyName ?? "—"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {order.slipRingType} · GP {order.clientGpNo} ·{" "}
                          {order.lrNo && <>LR {order.lrNo} · </>}
                          {formatDate(order.clientGpDate)}
                        </p>
                      </div>
                      <StageBadge stage={orderStage(order)} />
                    </div>
                    <div className="mt-3">
                      <ProgressBar value={order.totalDispatched} max={order.qtyReceived} />
                      <p className="mt-1 text-xs text-slate-500">
                        {order.totalDispatched} of {order.qtyReceived} dispatched
                      </p>
                    </div>
                  </Link>
                  <div className="mt-2">
                    <OrderActions order={order} />
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
