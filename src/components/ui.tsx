import Link from "next/link";
import { useId, type ReactNode } from "react";
import type { OrderStage } from "@/lib/format";
import { stageLabel } from "@/lib/format";

const buttonBase =
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 active:scale-[0.98]";

export const buttonStyles = {
  primary: `${buttonBase} bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/20`,
  secondary: `${buttonBase} border border-slate-200 bg-white px-4 py-2 text-slate-700 shadow-sm hover:bg-slate-50 hover:border-slate-300`,
  danger: `${buttonBase} bg-red-600 px-4 py-2 text-white hover:bg-red-700 shadow-sm shadow-red-500/20`,
  small: `${buttonBase} border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 shadow-sm hover:bg-slate-50`,
  icon: `${buttonBase} size-9 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-lg`,
  iconDanger: `${buttonBase} size-9 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg`,
};

export const inputStyles =
  "block w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm transition-all duration-200 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 hover:border-slate-300 disabled:bg-slate-50";

export const linkStyles = "font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline decoration-blue-300 underline-offset-4";

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: { href: string; label: string };
}) {
  return (
    <div className="mb-8">
      {back && (
        <Link
          href={back.href}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
        >
          ← {back.label}
        </Link>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          {description && <p className="mt-2 text-base text-slate-500">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Card({
  title,
  description,
  action,
  children,
  className = "",
  flush = false,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return (
    <section
      className={`animate-fade-in-up overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] ${className}`}
    >
      {(title || action) && (
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <h2 className="font-semibold text-slate-900 text-lg tracking-tight">{title}</h2>
            {description && (
              <p className="mt-1 text-sm text-slate-500">{description}</p>
            )}
          </div>
          {action}
        </header>
      )}
      <div className={flush ? "" : "p-6"}>{children}</div>
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
}) {
  return (
    <div className="animate-fade-in-up rounded-xl border border-slate-200/60 bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.04)] transition-shadow duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-4xl font-bold tabular-nums tracking-tight text-slate-900">
        {value}
      </p>
      {hint && <p className="mt-2 text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

const stageStyles: Record<OrderStage, string> = {
  open: "bg-slate-100 text-slate-700 ring-slate-200",
  partial: "bg-blue-50 text-blue-700 ring-blue-200",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

export function StageBadge({ stage }: { stage: OrderStage }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset ${stageStyles[stage]}`}
    >
      {stageLabel[stage]}
    </span>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
      <div
        className={`h-full rounded-full ${percent >= 100 ? "bg-emerald-500" : "bg-blue-500"}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: ReactNode;
  children: (id: string) => ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children(id)}
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="px-6 py-12 text-center">
      <p className="font-medium text-slate-900">{title}</p>
      {description && <p className="mt-1 text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function LoadingState({ error }: { error: string | null }) {
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-red-700">
        <p className="font-medium">Couldn&apos;t load data</p>
        <p className="mt-1">{error} Check that the database is running, then reload.</p>
      </div>
    );
  }
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[0, 1, 2, 3].map((key) => (
          <div key={key} className="h-28 animate-pulse rounded-lg bg-slate-200/70" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-lg bg-slate-200/70" />
    </div>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  );
}
