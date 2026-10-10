import type { Prisma } from "@prisma/client";
import type {
  DispatchWithReceiving,
  EntryStatus,
  LogItem,
  Order,
  ReceivingWithComputed,
  StockByCompany,
} from "./types";

// Fields of the parent receiving shown alongside every dispatch.
export const dispatchReceivingSelect = {
  id: true,
  sno: true,
  companyName: true,
  slipRingType: true,
  clientGpNo: true,
} as const;

type ReceivingRow = Prisma.ReceivingEntryGetPayload<{
  include: { dispatches: true };
}>;

type DispatchRow = Prisma.DispatchEntryGetPayload<{
  include: { receivingEntry: { select: typeof dispatchReceivingSelect } };
}>;

export function computeDue(receiving: {
  qtyReceived: number;
  dueOverride: number | null;
  dispatches: { dispatchQty: number }[];
}) {
  const totalDispatched = receiving.dispatches.reduce(
    (sum, dispatch) => sum + dispatch.dispatchQty,
    0,
  );
  const dueComputed = receiving.qtyReceived - totalDispatched;
  const effectiveDue = receiving.dueOverride ?? dueComputed;
  const status: EntryStatus = effectiveDue <= 0 ? "CLEARED" : "PENDING";

  return { totalDispatched, dueComputed, effectiveDue, status };
}

export function enrichReceiving(receiving: ReceivingRow): ReceivingWithComputed {
  const computed = computeDue(receiving);

  return {
    id: receiving.id,
    sno: receiving.sno,
    companyName: receiving.companyName,
    slipRingType: receiving.slipRingType,
    clientGpNo: receiving.clientGpNo,
    clientGpDate: receiving.clientGpDate.toISOString(),
    qtyReceived: receiving.qtyReceived,
    location: receiving.location,
    remarks: receiving.remarks,
    isAdjustment: receiving.isAdjustment,
    createdAt: receiving.createdAt.toISOString(),
    dueOverride: receiving.dueOverride,
    ...computed,
  };
}

export function toOrder(receiving: ReceivingRow): Order {
  return {
    ...enrichReceiving(receiving),
    dispatches: [...receiving.dispatches]
      .sort(
        (a, b) =>
          a.dispatchDate.getTime() - b.dispatchDate.getTime() || a.id - b.id,
      )
      .map((dispatch) => ({
        id: dispatch.id,
        internalGpNo: dispatch.internalGpNo,
        dispatchDate: dispatch.dispatchDate.toISOString(),
        dispatchQty: dispatch.dispatchQty,
        dispatchTo: dispatch.dispatchTo,
        remarks: dispatch.remarks,
        createdAt: dispatch.createdAt.toISOString(),
      })),
  };
}

export function serializeDispatch(dispatch: DispatchRow): DispatchWithReceiving {
  return {
    id: dispatch.id,
    receivingEntryId: dispatch.receivingEntryId,
    internalGpNo: dispatch.internalGpNo,
    dispatchDate: dispatch.dispatchDate.toISOString(),
    dispatchQty: dispatch.dispatchQty,
    dispatchTo: dispatch.dispatchTo,
    remarks: dispatch.remarks,
    createdAt: dispatch.createdAt.toISOString(),
    receivingEntry: dispatch.receivingEntry,
  };
}

// Stock is the sum of what is still due on every entry. Negative corrections
// are cleared entries with a negative due, so they must be counted too or a
// downward correction would never reduce the stock.
export function computeStockByCompany(
  receivings: ReceivingRow[],
): StockByCompany {
  const stock: StockByCompany = {};

  for (const receiving of receivings) {
    const company = receiving.companyName ?? "";
    const byType = (stock[company] ??= {});
    byType[receiving.slipRingType] =
      (byType[receiving.slipRingType] ?? 0) + computeDue(receiving).effectiveDue;
  }

  // Drop empty cells so companies with nothing in stock disappear.
  for (const [company, byType] of Object.entries(stock)) {
    for (const [type, qty] of Object.entries(byType)) {
      if (qty === 0) delete byType[type];
    }
    if (Object.keys(byType).length === 0) delete stock[company];
  }

  return stock;
}

export function getStock(
  stock: StockByCompany,
  companyName: string | null,
  slipRingType: string,
) {
  return stock[companyName ?? ""]?.[slipRingType] ?? 0;
}

export function buildUnifiedLog(
  receivings: ReceivingRow[],
  dispatches: DispatchRow[],
): LogItem[] {
  const items: LogItem[] = [
    ...receivings.map((receiving) => ({
      kind: "receiving" as const,
      id: receiving.id,
      createdAt: receiving.createdAt.toISOString(),
      data: enrichReceiving(receiving),
    })),
    ...dispatches.map((dispatch) => ({
      kind: "dispatch" as const,
      id: dispatch.id,
      createdAt: dispatch.createdAt.toISOString(),
      data: serializeDispatch(dispatch),
    })),
  ];

  return items.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}
