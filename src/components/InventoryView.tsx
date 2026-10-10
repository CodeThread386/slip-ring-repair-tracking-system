"use client";

import { FormEvent, useState } from "react";
import { DownloadIcon, TrashIcon } from "@/components/icons";
import { StockTable } from "@/components/StockTable";
import { useTracker } from "@/components/TrackerProvider";
import {
  buttonStyles,
  Card,
  EmptyState,
  Field,
  FormError,
  inputStyles,
  LoadingState,
  PageHeader,
} from "@/components/ui";
import { downloadCsv, formatDate, sum, todayInputValue, totalStock } from "@/lib/format";
import type { StockByCompany } from "@/lib/types";

function exportStock(stock: StockByCompany, slipRingTypes: string[]) {
  const companies = Object.keys(stock).sort((a, b) => a.localeCompare(b));
  const cell = (company: string, type: string) => stock[company]?.[type] ?? 0;
  downloadCsv(
    `stock-${todayInputValue()}.csv`,
    ["Slip ring type", ...companies.map((company) => company || "No company"), "Total"],
    [
      ...slipRingTypes.map((type) => [
        type,
        ...companies.map((company) => cell(company, type)),
        sum(companies.map((company) => cell(company, type))),
      ]),
      [
        "Total",
        ...companies.map((company) => sum(Object.values(stock[company]))),
        totalStock(stock),
      ],
    ],
  );
}

function AdjustStockForm() {
  const { data, refresh, notify } = useTracker();
  const [slipRingType, setSlipRingType] = useState(data?.slipRingTypes[0] ?? "");
  const [count, setCount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!data) return null;

  const current = Object.values(data.stockByCompany).reduce((sum, stock) => sum + (stock[slipRingType] ?? 0), 0);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const response = await fetch("/api/adjustments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slipRingType,
          newValue: Number(count),
          remarks,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Could not save the adjustment.");

      await refresh();
      notify(
        payload.adjustment
          ? `${slipRingType} set to ${count}`
          : "Stock already matches, nothing changed",
      );
      setCount("");
      setRemarks("");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Could not save the adjustment.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Slip ring type">
        {(id) => (
          <select
            id={id}
            required
            value={slipRingType}
            onChange={(event) => setSlipRingType(event.target.value)}
            className={inputStyles}
          >
            {data.slipRingTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        )}
      </Field>
      <Field
        label="Actual count"
        hint={`System shows ${current} right now.`}
      >
        {(id) => (
          <input
            id={id}
            type="number"
            required
            min={0}
            step={1}
            value={count}
            onChange={(event) => setCount(event.target.value)}
            className={inputStyles}
          />
        )}
      </Field>
      <Field label="Reason">
        {(id) => (
          <input
            id={id}
            required
            value={remarks}
            onChange={(event) => setRemarks(event.target.value)}
            placeholder="e.g. Physical count on 10 Oct"
            className={inputStyles}
          />
        )}
      </Field>
      <FormError message={error} />
      <button type="submit" disabled={saving} className={`${buttonStyles.primary} w-full`}>
        {saving ? "Saving…" : "Save adjustment"}
      </button>
    </form>
  );
}

export function InventoryView() {
  const { data, loadError, deleteAdjustment } = useTracker();
  if (!data) return <LoadingState error={loadError} />;

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Drums currently in the workshop, by company and slip ring type."
        actions={
          <button
            type="button"
            onClick={() => exportStock(data.stockByCompany, data.slipRingTypes)}
            className={buttonStyles.secondary}
          >
            <DownloadIcon />
            Export CSV
          </button>
        }
      />

      <Card flush title="Stock by company">
        <StockTable stockByCompany={data.stockByCompany} slipRingTypes={data.slipRingTypes} />
      </Card>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
        <Card
          title="Adjust stock"
          description="Physical count doesn't match? Enter the real number and the difference is logged."
        >
          <AdjustStockForm />
        </Card>

        <Card className="lg:col-span-2" flush title="Adjustment history">
          {data.adjustments.length === 0 ? (
            <EmptyState
              title="No adjustments"
              description="Stock has only changed through receivings and dispatches."
            />
          ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
                    <th className="px-4 py-2.5 font-medium">Date</th>
                    <th className="px-4 py-2.5 font-medium">Company</th>
                    <th className="px-4 py-2.5 font-medium">Slip ring type</th>
                    <th className="px-4 py-2.5 text-right font-medium">Change</th>
                    <th className="px-4 py-2.5 font-medium">Reason</th>
                    <th className="px-4 py-2.5">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.adjustments.map((adjustment) => (
                    <tr key={adjustment.id}>
                      <td className="whitespace-nowrap px-4 py-3">
                        {formatDate(adjustment.createdAt, { local: true })}
                      </td>
                      <td className="px-4 py-3">{adjustment.companyName ?? "—"}</td>
                      <td className="whitespace-nowrap px-4 py-3">{adjustment.slipRingType}</td>
                      <td
                        className={`px-4 py-3 text-right font-medium tabular-nums ${
                          adjustment.qtyReceived > 0 ? "text-emerald-700" : "text-red-600"
                        }`}
                      >
                        {adjustment.qtyReceived > 0 ? "+" : ""}
                        {adjustment.qtyReceived}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{adjustment.remarks}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          title="Delete adjustment"
                          aria-label="Delete adjustment"
                          onClick={() => deleteAdjustment(adjustment)}
                          className={buttonStyles.iconDanger}
                        >
                          <TrashIcon />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <ul className="divide-y divide-slate-100 md:hidden">
              {data.adjustments.map((adjustment) => (
                <li key={adjustment.id} className="px-4 py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {adjustment.companyName ?? "No company"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {adjustment.slipRingType} · {formatDate(adjustment.createdAt, { local: true })}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-semibold tabular-nums ${
                        adjustment.qtyReceived > 0 ? "text-emerald-700" : "text-red-600"
                      }`}
                    >
                      {adjustment.qtyReceived > 0 ? "+" : ""}
                      {adjustment.qtyReceived}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-xs text-slate-500">
                      {adjustment.remarks}
                    </p>
                    <button
                      type="button"
                      onClick={() => deleteAdjustment(adjustment)}
                      className={buttonStyles.iconDanger}
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </>
          )}
        </Card>
      </div>
    </>
  );
}
