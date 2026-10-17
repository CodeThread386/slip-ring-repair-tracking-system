"use client";

import { FormEvent, useState } from "react";
import { ModalFooter } from "@/components/Modal";
import { buttonStyles, Field, FormError, inputStyles } from "@/components/ui";
import { plural, todayInputValue } from "@/lib/format";
import type { Order, OrderDispatch } from "@/lib/types";

type DispatchFormProps = {
  order: Order;
  dispatch?: OrderDispatch;
  onSaved: (message: string) => void;
  onCancel: () => void;
};

export function DispatchForm({ order, dispatch, onSaved, onCancel }: DispatchFormProps) {
  // When editing, this dispatch's own drums count as available again.
  const available = order.effectiveDue + (dispatch?.dispatchQty ?? 0);

  const [dispatchQty, setDispatchQty] = useState(String(dispatch?.dispatchQty ?? available));
  const [internalGpNo, setInternalGpNo] = useState(dispatch?.internalGpNo ?? "");
  const [dispatchDate, setDispatchDate] = useState(
    dispatch ? dispatch.dispatchDate.slice(0, 10) : todayInputValue(),
  );
  const [dispatchTo, setDispatchTo] = useState(
    dispatch?.dispatchTo ?? order.companyName ?? "",
  );
  const [poNo, setPoNo] = useState(dispatch?.poNo ?? "");
  const [remarks, setRemarks] = useState(dispatch?.remarks ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overDispatchWarning, setOverDispatchWarning] = useState<string | null>(null);

  async function save(confirmOverDispatch: boolean) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        dispatch ? `/api/dispatch/${dispatch.id}` : "/api/dispatch",
        {
          method: dispatch ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            receivingEntryId: order.id,
            dispatchQty: Number(dispatchQty),
            internalGpNo,
            dispatchDate,
            dispatchTo,
            poNo,
            remarks,
            confirmOverDispatch,
          }),
        },
      );
      const payload = await response.json();

      if (response.status === 409 && payload.requiresConfirmation) {
        setOverDispatchWarning(payload.message);
        setSubmitting(false);
        return;
      }
      if (!response.ok) throw new Error(payload.error ?? "Could not save the dispatch.");

      onSaved(
        dispatch
          ? `Dispatch ${internalGpNo} updated`
          : `Dispatched ${plural(Number(dispatchQty), "drum")} from order #${order.sno}`,
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Could not save the dispatch.",
      );
      setSubmitting(false);
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    save(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
        <div className="rounded-md bg-slate-50 px-4 py-3 sm:col-span-2">
          <p className="text-slate-600">
            <span className="font-semibold text-slate-900">{available}</span> of{" "}
            {order.qtyReceived} drums available to dispatch on this order.
          </p>
        </div>
        <Field label="Drums to dispatch">
          {(id) => (
            <input
              id={id}
              type="number"
              required
              autoFocus
              min={1}
              max={available}
              step={1}
              value={dispatchQty}
              onChange={(event) => setDispatchQty(event.target.value)}
              className={inputStyles}
            />
          )}
        </Field>
        <Field label="Dispatch date">
          {(id) => (
            <input
              id={id}
              type="date"
              required
              value={dispatchDate}
              onChange={(event) => setDispatchDate(event.target.value)}
              className={inputStyles}
            />
          )}
        </Field>
        <Field label="Internal gate pass no.">
          {(id) => (
            <input
              id={id}
              required
              value={internalGpNo}
              onChange={(event) => setInternalGpNo(event.target.value)}
              className={inputStyles}
            />
          )}
        </Field>
        <Field label="Dispatched to">
          {(id) => (
            <input
              id={id}
              required
              value={dispatchTo}
              onChange={(event) => setDispatchTo(event.target.value)}
              className={inputStyles}
            />
          )}
        </Field>
        <Field label="P.O. no.">
          {(id) => (
            <input
              id={id}
              value={poNo}
              onChange={(event) => setPoNo(event.target.value)}
              placeholder="Optional"
              className={inputStyles}
            />
          )}
        </Field>
        <Field label="Remarks" className="sm:col-span-2">
          {(id) => (
            <textarea
              id={id}
              rows={2}
              value={remarks}
              onChange={(event) => setRemarks(event.target.value)}
              placeholder="Optional"
              className={inputStyles}
            />
          )}
        </Field>
        {overDispatchWarning && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 sm:col-span-2">
            <p>{overDispatchWarning}</p>
            <button
              type="button"
              disabled={submitting}
              onClick={() => save(true)}
              className="mt-2 font-semibold underline underline-offset-2"
            >
              Yes, dispatch anyway
            </button>
          </div>
        )}
        <div className="sm:col-span-2">
          <FormError message={error} />
        </div>
      </div>
      <ModalFooter>
        <button type="button" onClick={onCancel} className={buttonStyles.secondary}>
          Cancel
        </button>
        <button type="submit" disabled={submitting} className={buttonStyles.primary}>
          {submitting ? "Saving…" : dispatch ? "Save changes" : "Dispatch"}
        </button>
      </ModalFooter>
    </form>
  );
}
