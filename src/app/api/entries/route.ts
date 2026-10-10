import { NextResponse } from "next/server";
import {
  buildUnifiedLog,
  computeStockByCompany,
  dispatchReceivingSelect,
  enrichReceiving,
  toOrder,
} from "@/lib/calculations";
import { SEEDED_SLIP_RING_TYPES } from "@/lib/constants";
import { getAllReceivingWithDispatches } from "@/lib/db-helpers";
import { prisma } from "@/lib/prisma";
import type { EntriesResponse } from "@/lib/types";

function sortedUnique(values: Iterable<string>) {
  return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
}

export async function GET() {
  const entries = await getAllReceivingWithDispatches();
  const dispatches = await prisma.dispatchEntry.findMany({
    include: { receivingEntry: { select: dispatchReceivingSelect } },
    orderBy: { createdAt: "desc" },
  });

  const newestFirst = [...entries].reverse();

  const response: EntriesResponse = {
    orders: newestFirst.filter((entry) => !entry.isAdjustment).map(toOrder),
    adjustments: newestFirst
      .filter((entry) => entry.isAdjustment)
      .map(enrichReceiving),
    activity: buildUnifiedLog(entries, dispatches),
    stockByCompany: computeStockByCompany(entries),
    slipRingTypes: sortedUnique([
      ...SEEDED_SLIP_RING_TYPES,
      ...entries.map((entry) => entry.slipRingType),
    ]),
    companies: sortedUnique(
      entries.flatMap((entry) => (entry.companyName ? [entry.companyName] : [])),
    ),
  };

  return NextResponse.json(response);
}
