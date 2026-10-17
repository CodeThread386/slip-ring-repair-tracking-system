"use client";

import { FormEvent, useState } from "react";
import { ModalFooter } from "@/components/Modal";
import { SlipRingTypeSelect } from "@/components/SlipRingTypeSelect";
import { useTracker } from "@/components/TrackerProvider";
import { buttonStyles, Field, FormError, inputStyles } from "@/components/ui";
import { todayInputValue } from "@/lib/format";
import type { Order } from "@/lib/types";

type ReceiveFormProps = {
  order?: Order;
  onSaved: (message: string) => void;
  onCancel: () => void;
};

export function ReceiveForm({ order, onSaved, onCancel }: ReceiveFormProps) {
  const { data } = useTracker();
  const [companyName, setCompanyName] = useState(order?.companyName ?? "");
  const [slipRingType, setSlipRingType] = useState(order?.slipRingType ?? "");
  const [qtyReceived, setQtyReceived] = useState(String(order?.qtyReceived ?? 1));
  const [clientGpNo, setClientGpNo] = useState(order?.clientGpNo ?? "");
  const [clientGpDate, setClientGpDate] = useState(
    order ? order.clientGpDate.slice(0, 10) : todayInputValue(),
  );
  const [lrNo, setLrNo] = useState(order?.lrNo ?? "");
  const [location, setLocation] = useState(order?.location ?? "");
  const [remarks, setRemarks] = useState(order?.remarks ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minQty = Math.max(1, order?.totalDispatched ?? 0);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(
        order ? `/api/receiving/${order.id}` : "/api/receiving",
        {
          method: order ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName,
            slipRingType,
            qtyReceived: Number(qtyReceived),
            clientGpNo,
            clientGpDate,
            lrNo,
            location,
            remarks,
          }),
        },
      );
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not save the order.");

      onSaved(
        order
          ? `Order #${order.sno} updated`
          : `Order #${payload.sno} created · ${payload.qtyReceived} × ${payload.slipRingType}`,
      );
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Could not save the order.",
      );
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 px-6 py-5 sm:grid-cols-2">
        <Field label="Company">
          {(id) => (
            <>
              <input
                id={id}
                required
                autoFocus
                list="company-options"
                autoComplete="off"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                placeholder="e.g. Tata Steel Plant"
                className={inputStyles}
              />
              <datalist id="company-options">
                {data?.companies.map((company) => (
                  <option key={company} value={company} />
                ))}
              </datalist>
            </>
          )}
        </Field>
        <Field label="Slip ring type">
          {(id) => (
            <SlipRingTypeSelect
              id={id}
              value={slipRingType}
              onChange={setSlipRingType}
              knownTypes={data?.slipRingTypes ?? []}
              required
            />
          )}
        </Field>
        <Field
          label="Drums received"
          hint={
            order && order.totalDispatched > 0
              ? `${order.totalDispatched} already dispatched, so at least ${order.totalDispatched}.`
              : undefined
          }
        >
          {(id) => (
            <input
              id={id}
              type="number"
              required
              min={minQty}
              step={1}
              value={qtyReceived}
              onChange={(event) => setQtyReceived(event.target.value)}
              className={inputStyles}
            />
          )}
        </Field>
        <Field label="Workshop location">
          {(id) => (
            <input
              id={id}
              required
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="e.g. Bay 2 / Rack B"
              className={inputStyles}
            />
          )}
        </Field>
        <Field label="Client gate pass no.">
          {(id) => (
            <input
              id={id}
              required
              value={clientGpNo}
              onChange={(event) => setClientGpNo(event.target.value)}
              className={inputStyles}
            />
          )}
        </Field>
        <Field label="Gate pass date">
          {(id) => (
            <input
              id={id}
              type="date"
              required
              value={clientGpDate}
              onChange={(event) => setClientGpDate(event.target.value)}
              className={inputStyles}
            />
          )}
        </Field>
        <Field label="L.R. no.">
          {(id) => (
            <input
              id={id}
              value={lrNo}
              onChange={(event) => setLrNo(event.target.value)}
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
        <div className="sm:col-span-2">
          <FormError message={error} />
        </div>
      </div>
      <ModalFooter>
        <button type="button" onClick={onCancel} className={buttonStyles.secondary}>
          Cancel
        </button>
        <button type="submit" disabled={submitting} className={buttonStyles.primary}>
          {submitting ? "Saving…" : order ? "Save changes" : "Create order"}
        </button>
      </ModalFooter>
    </form>
  );
}
