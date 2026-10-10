"use client";

import Link from "next/link";
import { InboxIcon, SlidersIcon, TruckIcon } from "@/components/icons";
import { StockTable } from "@/components/StockTable";
import { useTracker } from "@/components/TrackerProvider";
import {
  buttonStyles,
  Card,
  EmptyState,
  linkStyles,
  LoadingState,
  PageHeader,
  StatCard,
} from "@/components/ui";
import {
  daysSince,
  formatDate,
  formatDateTime,
  isThisMonth,
  plural,
  sum,
  totalStock,
} from "@/lib/format";
import type { LogItem } from "@/lib/types";

const AGEING_DAYS = 30;

function ActivityRow({ item }: { item: LogItem }) {
  if (item.kind === "dispatch") {
    const dispatch = item.data;
    return (
      <li className="flex gap-3 px-5 py-3">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-blue-50 text-blue-600">
          <TruckIcon className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-slate-900">
            Dispatched {dispatch.dispatchQty} × {dispatch.receivingEntry.slipRingType}
          </p>
          <p className="truncate text-xs text-slate-500">
            To {dispatch.dispatchTo} ·{" "}
            <Link href={`/orders/${dispatch.receivingEntryId}`} className={linkStyles}>
              Order #{dispatch.receivingEntry.sno}
            </Link>
          </p>
        </div>
        <time className="shrink-0 text-xs text-slate-400">{formatDateTime(item.createdAt)}</time>
      </li>
    );
  }

  const receiving = item.data;
  const isAdjustment = receiving.isAdjustment;
  return (
    <li className="flex gap-3 px-5 py-3">
      <span
        className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-full ${
          isAdjustment ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
        }`}
      >
        {isAdjustment ? (
          <SlidersIcon className="size-3.5" />
        ) : (
          <InboxIcon className="size-3.5" />
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-slate-900">
          {isAdjustment
            ? `Stock adjusted ${receiving.qtyReceived > 0 ? "+" : ""}${receiving.qtyReceived} × ${receiving.slipRingType}`
            : `Received ${receiving.qtyReceived} × ${receiving.slipRingType}`}
        </p>
        <p className="truncate text-xs text-slate-500">
          {receiving.companyName ?? "No company"}
          {!isAdjustment && (
            <>
              {" · "}
              <Link href={`/orders/${receiving.id}`} className={linkStyles}>
                Order #{receiving.sno}
              </Link>
            </>
          )}
        </p>
      </div>
      <time className="shrink-0 text-xs text-slate-400">{formatDateTime(item.createdAt)}</time>
    </li>
  );
}

export function Dashboard() {
  const { data, loadError, openModal } = useTracker();
  if (!data) return <LoadingState error={loadError} />;

  const openOrders = data.orders.filter((order) => order.status === "PENDING");
  const ageingCount = openOrders.filter(
    (order) => daysSince(order.clientGpDate) > AGEING_DAYS,
  ).length;
  const oldestOpen = [...openOrders]
    .sort((a, b) => a.clientGpDate.localeCompare(b.clientGpDate) || a.sno - b.sno)
    .slice(0, 6);
  const receivedThisMonth = sum(
    data.orders.filter((order) => isThisMonth(order.clientGpDate)).map((order) => order.qtyReceived),
  );
  const dispatchedThisMonth = sum(
    data.orders
      .flatMap((order) => order.dispatches)
      .filter((dispatch) => isThisMonth(dispatch.dispatchDate))
      .map((dispatch) => dispatch.dispatchQty),
  );
  const companiesInStock = Object.keys(data.stockByCompany).length;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Drums in the workshop and orders waiting to go out."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Drums in stock"
          value={totalStock(data.stockByCompany)}
          hint={`Across ${plural(companiesInStock, "company")}`}
        />
        <StatCard
          label="Open orders"
          value={openOrders.length}
          hint={
            ageingCount > 0 ? (
              <span className="text-amber-700">
                {ageingCount} older than {AGEING_DAYS} days
              </span>
            ) : (
              "None older than 30 days"
            )
          }
        />
        <StatCard label="Received this month" value={receivedThisMonth} hint="Drums" />
        <StatCard label="Dispatched this month" value={dispatchedThisMonth} hint="Drums" />
      </div>

      <Card
        className="mt-6"
        flush
        title="Stock by company"
        description="Drums currently in the workshop. Click a company to see its open orders."
        action={
          <Link href="/inventory" className={`${linkStyles} text-sm`}>
            Inventory →
          </Link>
        }
      >
        <StockTable stockByCompany={data.stockByCompany} slipRingTypes={data.slipRingTypes} />
      </Card>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-5">
        <Card
          className="lg:col-span-3"
          flush
          title="Oldest open orders"
          description="Waiting longest for dispatch."
          action={
            <Link href="/orders?status=open" className={`${linkStyles} text-sm`}>
              All open orders →
            </Link>
          }
        >
          {oldestOpen.length === 0 ? (
            <EmptyState
              title="Nothing waiting"
              description="Every order has been fully dispatched."
            />
          ) : (
            <ul className="divide-y divide-slate-100">
              {oldestOpen.map((order) => {
                const age = daysSince(order.clientGpDate);
                return (
                  <li key={order.id} className="flex items-center gap-4 px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate">
                        <Link href={`/orders/${order.id}`} className={linkStyles}>
                          #{order.sno}
                        </Link>{" "}
                        <span className="font-medium">{order.companyName ?? "No company"}</span>
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {order.slipRingType} · {order.effectiveDue} of {order.qtyReceived} in
                        stock · received {formatDate(order.clientGpDate)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-medium tabular-nums ${
                        age > AGEING_DAYS ? "text-amber-700" : "text-slate-500"
                      }`}
                    >
                      {plural(age, "day")}
                    </span>
                    <button
                      type="button"
                      onClick={() => openModal({ kind: "dispatch", order })}
                      className={buttonStyles.small}
                    >
                      Dispatch
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-2" flush title="Recent activity">
          {data.activity.length === 0 ? (
            <EmptyState title="No activity yet" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.activity.slice(0, 8).map((item) => (
                <ActivityRow key={`${item.kind}-${item.id}`} item={item} />
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
