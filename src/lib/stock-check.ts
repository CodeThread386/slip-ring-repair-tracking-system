import { computeStockByCompany, getStock } from "./calculations";
import { prisma } from "./prisma";
import type { StockCeilingCheck } from "./types";

export async function checkStockCeiling(
  companyName: string | null,
  slipRingType: string,
  additionalDispatchQty: number,
): Promise<StockCeilingCheck> {
  const receivings = await prisma.receivingEntry.findMany({
    where: { companyName, slipRingType },
    include: { dispatches: true },
  });

  const currentStock = getStock(
    computeStockByCompany(receivings),
    companyName,
    slipRingType,
  );
  const projectedStock = currentStock - additionalDispatchQty;

  return {
    companyName,
    slipRingType,
    currentStock,
    projectedStock,
    wouldExceed: projectedStock < 0,
    deficit: Math.max(0, -projectedStock),
  };
}

export function overDispatchMessage(check: StockCeilingCheck) {
  const label = check.companyName
    ? `${check.companyName} · ${check.slipRingType}`
    : check.slipRingType;
  return `This would put ${label} stock at -${check.deficit}. Dispatch anyway?`;
}
