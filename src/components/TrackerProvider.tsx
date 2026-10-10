"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { DispatchForm } from "@/components/DispatchForm";
import { CheckIcon, XIcon } from "@/components/icons";
import { Modal, ModalFooter } from "@/components/Modal";
import { ReceiveForm } from "@/components/ReceiveForm";
import { buttonStyles } from "@/components/ui";
import { plural } from "@/lib/format";
import type {
  EntriesResponse,
  Order,
  OrderDispatch,
  ReceivingWithComputed,
} from "@/lib/types";

export type ModalRequest =
  | { kind: "receive" }
  | { kind: "editOrder"; order: Order }
  | { kind: "dispatch"; order: Order }
  | { kind: "editDispatch"; order: Order; dispatch: OrderDispatch };

type ConfirmRequest = {
  title: string;
  message: string;
  confirmLabel: string;
  resolve: (confirmed: boolean) => void;
};

type Toast = { id: number; message: string; tone: "success" | "error" };

type TrackerContextValue = {
  data: EntriesResponse | null;
  loadError: string | null;
  refresh: () => Promise<void>;
  openModal: (request: ModalRequest) => void;
  notify: (message: string, tone?: Toast["tone"]) => void;
  deleteOrder: (order: Order) => Promise<boolean>;
  deleteDispatch: (order: Order, dispatch: OrderDispatch) => Promise<void>;
  deleteAdjustment: (adjustment: ReceivingWithComputed) => Promise<void>;
};

const TrackerContext = createContext<TrackerContextValue | null>(null);

export function useTracker() {
  const value = useContext(TrackerContext);
  if (!value) throw new Error("useTracker must be used inside TrackerProvider");
  return value;
}

async function loadEntries(): Promise<EntriesResponse> {
  const response = await fetch("/api/entries", { cache: "no-store" });
  if (!response.ok) throw new Error("Could not load data from the server.");
  return response.json();
}

export function TrackerProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<EntriesResponse | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalRequest | null>(null);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    loadEntries()
      .then(setData)
      .catch((error: unknown) =>
        setLoadError(error instanceof Error ? error.message : "Could not load data."),
      );
  }, []);

  const refresh = useCallback(async () => {
    setData(await loadEntries());
  }, []);

  const notify = useCallback((message: string, tone: Toast["tone"] = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, message, tone }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const confirm = useCallback(
    (options: Omit<ConfirmRequest, "resolve">) =>
      new Promise<boolean>((resolve) => setConfirmRequest({ ...options, resolve })),
    [],
  );

  function settleConfirm(confirmed: boolean) {
    confirmRequest?.resolve(confirmed);
    setConfirmRequest(null);
  }

  async function runDelete(url: string, successMessage: string) {
    try {
      const response = await fetch(url, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error ?? "Delete failed.");
      await refresh();
      notify(successMessage);
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Delete failed.", "error");
      return false;
    }
  }

  async function deleteOrder(order: Order) {
    if (order.dispatches.length > 0) {
      notify(
        `Order #${order.sno} has ${plural(order.dispatches.length, "dispatch")}. Delete those first.`,
        "error",
      );
      return false;
    }
    const confirmed = await confirm({
      title: `Delete order #${order.sno}?`,
      message: `${order.qtyReceived} × ${order.slipRingType} from ${order.companyName ?? "unknown company"} (GP ${order.clientGpNo}) will be removed. This can't be undone.`,
      confirmLabel: "Delete order",
    });
    if (!confirmed) return false;
    return runDelete(`/api/receiving/${order.id}`, `Order #${order.sno} deleted`);
  }

  async function deleteDispatch(order: Order, dispatch: OrderDispatch) {
    const confirmed = await confirm({
      title: "Delete dispatch?",
      message: `${plural(dispatch.dispatchQty, "drum")} sent to ${dispatch.dispatchTo} on gate pass ${dispatch.internalGpNo} will be removed, and order #${order.sno} will show them as in stock again.`,
      confirmLabel: "Delete dispatch",
    });
    if (!confirmed) return;
    await runDelete(`/api/dispatch/${dispatch.id}`, `Dispatch ${dispatch.internalGpNo} deleted`);
  }

  async function deleteAdjustment(adjustment: ReceivingWithComputed) {
    const confirmed = await confirm({
      title: "Delete stock adjustment?",
      message: `The ${adjustment.qtyReceived > 0 ? "+" : ""}${adjustment.qtyReceived} adjustment for ${adjustment.companyName ?? "unknown company"} · ${adjustment.slipRingType} will be removed and stock recalculated.`,
      confirmLabel: "Delete adjustment",
    });
    if (!confirmed) return;
    await runDelete(`/api/receiving/${adjustment.id}`, "Adjustment deleted");
  }

  async function handleSaved(message: string) {
    setModal(null);
    try {
      await refresh();
      notify(message);
    } catch {
      notify("Saved, but the page could not refresh. Reload to see it.", "error");
    }
  }

  const closeModal = () => setModal(null);

  return (
    <TrackerContext.Provider
      value={{
        data,
        loadError,
        refresh,
        openModal: setModal,
        notify,
        deleteOrder,
        deleteDispatch,
        deleteAdjustment,
      }}
    >
      {children}

      {modal?.kind === "receive" && (
        <Modal
          title="New receiving"
          description="Log drums received from a company."
          onClose={closeModal}
        >
          <ReceiveForm onSaved={handleSaved} onCancel={closeModal} />
        </Modal>
      )}
      {modal?.kind === "editOrder" && (
        <Modal title={`Edit order #${modal.order.sno}`} onClose={closeModal}>
          <ReceiveForm order={modal.order} onSaved={handleSaved} onCancel={closeModal} />
        </Modal>
      )}
      {(modal?.kind === "dispatch" || modal?.kind === "editDispatch") && (
        <Modal
          title={modal.kind === "dispatch" ? "Dispatch drums" : "Edit dispatch"}
          description={`Order #${modal.order.sno} · ${modal.order.companyName ?? "—"} · ${modal.order.slipRingType}`}
          onClose={closeModal}
        >
          <DispatchForm
            order={modal.order}
            dispatch={modal.kind === "editDispatch" ? modal.dispatch : undefined}
            onSaved={handleSaved}
            onCancel={closeModal}
          />
        </Modal>
      )}

      {confirmRequest && (
        <Modal title={confirmRequest.title} onClose={() => settleConfirm(false)} size="md">
          <p className="px-6 py-5 text-slate-600">{confirmRequest.message}</p>
          <ModalFooter>
            <button
              type="button"
              className={buttonStyles.secondary}
              onClick={() => settleConfirm(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className={buttonStyles.danger}
              onClick={() => settleConfirm(true)}
            >
              {confirmRequest.confirmLabel}
            </button>
          </ModalFooter>
        </Modal>
      )}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-lg"
          >
            {toast.tone === "success" ? (
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            ) : (
              <XIcon className="mt-0.5 size-4 shrink-0 text-red-600" />
            )}
            <p className="text-slate-700">{toast.message}</p>
          </div>
        ))}
      </div>
    </TrackerContext.Provider>
  );
}
