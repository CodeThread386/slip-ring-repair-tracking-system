export type ReceivingInput = {
  companyName: string;
  slipRingType: string;
  clientGpNo: string;
  clientGpDate: Date;
  lrNo: string | null;
  qtyReceived: number;
  location: string;
  remarks: string | null;
};

// Shared by create and edit so both enforce the same rules.
export function parseReceivingInput(
  body: Record<string, unknown>,
): { input: ReceivingInput } | { error: string } {
  const companyName = String(body.companyName ?? "").trim();
  const slipRingType = String(body.slipRingType ?? "").trim();
  const clientGpNo = String(body.clientGpNo ?? "").trim();
  const location = String(body.location ?? "").trim();
  const lrNo = body.lrNo ? String(body.lrNo).trim() || null : null;
  const remarks = body.remarks ? String(body.remarks).trim() || null : null;
  const qtyReceived = Number(body.qtyReceived);
  const clientGpDate = body.clientGpDate
    ? new Date(String(body.clientGpDate))
    : null;

  if (!companyName) return { error: "Company name is required." };
  if (!slipRingType) return { error: "Slip ring type is required." };
  if (!clientGpNo) return { error: "Client gate pass number is required." };
  if (!location) return { error: "Location is required." };
  if (!Number.isInteger(qtyReceived) || qtyReceived <= 0) {
    return { error: "Quantity received must be a positive whole number." };
  }
  if (!clientGpDate || Number.isNaN(clientGpDate.getTime())) {
    return { error: "A valid client gate pass date is required." };
  }

  return {
    input: {
      companyName,
      slipRingType,
      clientGpNo,
      clientGpDate,
      lrNo,
      qtyReceived,
      location,
      remarks,
    },
  };
}
