import Link from "next/link";
import { EmptyState } from "@/components/ui";
import { sum } from "@/lib/format";
import type { StockByCompany } from "@/lib/types";

type StockTableProps = {
  stockByCompany: StockByCompany;
  slipRingTypes: string[];
};

// One column per company, one row per slip ring type.
export function StockTable({ stockByCompany, slipRingTypes }: StockTableProps) {
  const companies = Object.keys(stockByCompany).sort((a, b) => a.localeCompare(b));

  if (companies.length === 0) {
    return (
      <EmptyState
        title="No drums in stock"
        description="Drums show up here as soon as a receiving is logged."
      />
    );
  }

  const cell = (company: string, type: string) => stockByCompany[company]?.[type] ?? 0;
  const companyTotal = (company: string) =>
    sum(Object.values(stockByCompany[company] ?? {}));
  const typeTotal = (type: string) => sum(companies.map((company) => cell(company, type)));
  const grandTotal = sum(companies.map(companyTotal));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500">
            <th className="sticky left-0 bg-slate-50 px-5 py-3 text-left font-medium">
              Slip ring type
            </th>
            {companies.map((company) => (
              <th key={company} className="min-w-32 px-4 py-3 text-right font-medium">
                {company ? (
                  <Link
                    href={`/orders?company=${encodeURIComponent(company)}&status=open`}
                    className="text-slate-700 hover:text-blue-700 hover:underline"
                  >
                    {company}
                  </Link>
                ) : (
                  "No company"
                )}
              </th>
            ))}
            <th className="min-w-24 border-l border-slate-200 px-5 py-3 text-right font-semibold text-slate-700">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {slipRingTypes.map((type) => (
            <tr key={type} className="hover:bg-slate-50/60">
              <td className="sticky left-0 whitespace-nowrap bg-white px-5 py-2.5 text-slate-700">
                {type}
              </td>
              {companies.map((company) => {
                const qty = cell(company, type);
                return (
                  <td
                    key={company}
                    className={`px-4 py-2.5 text-right tabular-nums ${
                      qty === 0
                        ? "text-slate-300"
                        : qty < 0
                          ? "font-semibold text-red-600"
                          : "font-medium text-slate-900"
                    }`}
                  >
                    {qty === 0 ? "–" : qty}
                  </td>
                );
              })}
              <td className="border-l border-slate-200 px-5 py-2.5 text-right font-semibold tabular-nums">
                {typeTotal(type)}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-slate-200 bg-slate-50 font-semibold">
            <td className="sticky left-0 bg-slate-50 px-5 py-3">Total in stock</td>
            {companies.map((company) => (
              <td key={company} className="px-4 py-3 text-right text-base tabular-nums">
                {companyTotal(company)}
              </td>
            ))}
            <td className="border-l border-slate-200 px-5 py-3 text-right text-base tabular-nums">
              {grandTotal}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
