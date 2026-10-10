import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeDue, enrichReceiving } from "@/lib/calculations";
import { getNextSno } from "@/lib/db-helpers";

// Corrects the total stock of a slip ring type across all companies. The
// difference is stored as one company-less adjustment entry.
export async function POST(request: Request) {
  const body = await request.json();

  const slipRingType = String(body.slipRingType ?? "").trim();
  const newValue = Number(body.newValue);
  const remarks = String(body.remarks ?? "").trim();

  if (!slipRingType) {
    return NextResponse.json(
      { error: "Slip ring type is required." },
      { status: 400 },
    );
  }

  if (!Number.isInteger(newValue) || newValue < 0) {
    return NextResponse.json(
      { error: "New stock value must be a whole number, 0 or more." },
      { status: 400 },
    );
  }

  if (!remarks) {
    return NextResponse.json(
      { error: "Remarks are required for manual stock corrections." },
      { status: 400 },
    );
  }

  const receivings = await prisma.receivingEntry.findMany({
    where: { slipRingType },
    include: { dispatches: true },
  });

  const currentComputed = receivings.reduce(
    (total, receiving) => total + computeDue(receiving).effectiveDue,
    0,
  );
  const delta = newValue - currentComputed;

  if (delta === 0) {
    return NextResponse.json({
      message: "No adjustment needed.",
      slipRingType,
      stockOnHand: currentComputed,
    });
  }

  const adjustment = await prisma.receivingEntry.create({
    data: {
      sno: await getNextSno(),
      companyName: null,
      slipRingType,
      clientGpNo: "ADJUSTMENT",
      clientGpDate: new Date(),
      qtyReceived: delta,
      location: "Manual correction",
      remarks,
      isAdjustment: true,
    },
    include: { dispatches: true },
  });

  return NextResponse.json(
    {
      adjustment: enrichReceiving(adjustment),
      previousStock: currentComputed,
      newStock: newValue,
    },
    { status: 201 },
  );
}
