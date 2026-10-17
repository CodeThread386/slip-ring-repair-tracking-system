export type DispatchInput = {
  internalGpNo: string;
  dispatchDate: Date;
  dispatchQty: number;
  dispatchTo: string;
  poNo: string | null;
  remarks: string | null;
};

// Shared by create and edit so both enforce the same rules.
export function parseDispatchInput(
  body: Record<string, unknown>,
): { input: DispatchInput } | { error: string } {
  const internalGpNo = String(body.internalGpNo ?? "").trim();
  const dispatchTo = String(body.dispatchTo ?? "").trim();
  const poNo = body.poNo ? String(body.poNo).trim() || null : null;
  const remarks = body.remarks ? String(body.remarks).trim() || null : null;
  const dispatchQty = Number(body.dispatchQty);
  const dispatchDate = body.dispatchDate
    ? new Date(String(body.dispatchDate))
    : null;

  if (!internalGpNo) return { error: "Internal gate pass number is required." };
  if (!dispatchTo) return { error: "Dispatch destination is required." };
  if (!Number.isInteger(dispatchQty) || dispatchQty <= 0) {
    return { error: "Dispatch quantity must be a positive whole number." };
  }
  if (!dispatchDate || Number.isNaN(dispatchDate.getTime())) {
    return { error: "A valid dispatch date is required." };
  }

  return {
    input: { internalGpNo, dispatchDate, dispatchQty, dispatchTo, poNo, remarks },
  };
}
