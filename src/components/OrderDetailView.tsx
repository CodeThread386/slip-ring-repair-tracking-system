"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { CheckIcon, InboxIcon, PencilIcon, TrashIcon, TruckIcon } from "@/components/icons";
import { useTracker } from "@/components/TrackerProvider";
import {
  buttonStyles,
  Card,
  EmptyState,
  LoadingState,
  PageHeader,
  ProgressBar,
  StageBadge,
  StatCard,
} from "@/components/ui";
import { daysSince, formatDate, orderStage, plural } from "@/lib/format";

function TimelineItem({
  icon,
  tone,
  title,
  meta,
  children,
  actions,
  last = false,
}: {
  icon: ReactNode;
  tone: "emerald" | "blue" | "slate";
  title: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  actions?: ReactNode;
  last?: boolean;
}) {
  const toneStyles = {
    emerald: "bg-emerald-50 text-emerald-600 ring-emerald-200",
    blue: "bg-blue-50 text-blue-600 ring-blue-200",
    slate: "bg-white text-slate-400 ring-slate-200",
  };
  return (
    <li className="relative flex gap-4 pb-6 last:pb-0">
      {!last && <span className="absolute left-4 top-9 bottom-0 w-px bg-slate-200" aria-hidden />}
      <span
        className={`relative grid size-8 shrink-0 place-items-center rounded-full ring-1 ${toneStyles[tone]}`}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="font-medium text-slate-900">{title}</p>
            {meta && <p className="text-xs text-slate-500">{meta}</p>}
          </div>
          {actions}
        </div>
        {children && <div className="mt-1.5 text-slate-600">{children}</div>}
      </div>
    </li>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-4 px-5 py-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="col-span-2 text-slate-900">{value}</dd>
    </div>
  );
}

export function OrderDetailView({ id }: { id: number }) {
  const { data, loadError, openModal, deleteOrder, deleteDispatch } = useTracker();
  const router = useRouter();

  if (!data) return <LoadingState error={loadError} />;

  const order = data.orders.find((candidate) => candidate.id === id);
  if (!order) {
    return (
      <Card>
        <EmptyState
          title="Order not found"
          description="It may have been deleted."
          action={
            <button
              type="button"
              onClick={() => router.push("/orders")}
              className={buttonStyles.secondary}
            >
              Back to orders
            </button>
          }
        />
      </Card>
    );
  }

  const stage = orderStage(order);
  const lastDispatch = order.dispatches.at(-1);
  const workshopDays =
    stage === "completed" && lastDispatch
      ? daysSince(order.clientGpDate) - daysSince(lastDispatch.dispatchDate)
      : daysSince(order.clientGpDate);

  return (
    <>
      <PageHeader
        back={{ href: "/orders", label: "Orders" }}
        title={
          <span className="flex flex-wrap items-center gap-3">
            Order #{order.sno}
            <StageBadge stage={stage} />
          </span>
        }
        description={`${order.companyName ?? "No company"} · ${order.slipRingType} · received ${formatDate(order.clientGpDate)}`}
        actions={
          <>
            <button
              type="button"
              onClick={async () => {
                if (await deleteOrder(order)) router.push("/orders");
              }}
              className={buttonStyles.secondary}
            >
              <TrashIcon />
              Delete
            </button>
            <button
              type="button"
              onClick={() => openModal({ kind: "editOrder", order })}
              className={buttonStyles.secondary}
            >
              <PencilIcon />
              Edit
            </button>
            {order.status === "PENDING" && (
              <button
                type="button"
                onClick={() => openModal({ kind: "dispatch", order })}
                className={buttonStyles.primary}
              >
                <TruckIcon />
                Dispatch drums
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Received" value={order.qtyReceived} hint="Drums" />
        <StatCard label="Dispatched" value={order.totalDispatched} hint={plural(order.dispatches.length, "dispatch")} />
        <StatCard label="In stock" value={order.effectiveDue} hint="Still in the workshop" />
        <StatCard
          label={stage === "completed" ? "Turnaround" : "In workshop"}
          value={plural(workshopDays, "day")}
          hint={stage === "completed" ? "Received to last dispatch" : "Since gate pass date"}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3" title="Tracking">
          <div className="mb-6">
            <ProgressBar value={order.totalDispatched} max={order.qtyReceived} />
            <p className="mt-1.5 text-xs text-slate-500">
              {order.totalDispatched} of {order.qtyReceived} drums dispatched
            </p>
          </div>
          <ol>
            <TimelineItem
              icon={<InboxIcon className="size-4" />}
              tone="emerald"
              title={`Received ${plural(order.qtyReceived, "drum")}`}
              meta={formatDate(order.clientGpDate)}
            >
              Client gate pass {order.clientGpNo} · stored at {order.location}
            </TimelineItem>
            {order.dispatches.map((dispatch) => (
              <TimelineItem
                key={dispatch.id}
                icon={<TruckIcon className="size-4" />}
                tone="blue"
                title={`Dispatched ${plural(dispatch.dispatchQty, "drum")} to ${dispatch.dispatchTo}`}
                meta={formatDate(dispatch.dispatchDate)}
                actions={
                  <div className="flex gap-1">
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
                }
              >
                Internal gate pass {dispatch.internalGpNo}
                {dispatch.poNo && <> · PO {dispatch.poNo}</>}
                {dispatch.remarks && <span className="text-slate-500"> · {dispatch.remarks}</span>}
              </TimelineItem>
            ))}
            {stage === "completed" ? (
              <TimelineItem
                last
                icon={<CheckIcon className="size-4" />}
                tone="emerald"
                title="Order completed"
                meta={lastDispatch ? formatDate(lastDispatch.dispatchDate) : undefined}
              >
                All drums have left the workshop.
              </TimelineItem>
            ) : (
              <TimelineItem
                last
                icon={<span className="size-2 rounded-full bg-slate-300" />}
                tone="slate"
                title={`${plural(order.effectiveDue, "drum")} still to dispatch`}
                actions={
                  <button
                    type="button"
                    onClick={() => openModal({ kind: "dispatch", order })}
                    className={buttonStyles.small}
                  >
                    Dispatch
                  </button>
                }
              />
            )}
          </ol>
        </Card>

        <Card className="lg:col-span-2" flush title="Details">
          <dl className="divide-y divide-slate-100">
            <Detail label="Company" value={order.companyName ?? "—"} />
            <Detail label="Slip ring type" value={order.slipRingType} />
            <Detail label="Client GP no." value={order.clientGpNo} />
            <Detail label="GP date" value={formatDate(order.clientGpDate)} />
            <Detail label="L.R. no." value={order.lrNo || "—"} />
            <Detail label="Location" value={order.location} />
            <Detail label="Remarks" value={order.remarks || <span className="text-slate-400">None</span>} />
          </dl>
        </Card>
      </div>
    </>
  );
}
