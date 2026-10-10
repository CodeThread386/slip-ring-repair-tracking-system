import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  computeDue,
  dispatchReceivingSelect,
  enrichReceiving,
  serializeDispatch,
} from "@/lib/calculations";
import { parseDispatchInput } from "@/lib/dispatch-input";
import { checkStockCeiling, overDispatchMessage } from "@/lib/stock-check";

export async function POST(request: Request) {
  const body = await request.json();

  const receivingEntryId = Number(body.receivingEntryId);
  const confirmOverDispatch = Boolean(body.confirmOverDispatch);

  if (!Number.isInteger(receivingEntryId) || receivingEntryId <= 0) {
    return NextResponse.json(
      { error: "A valid pending receiving entry must be selected." },
      { status: 400 },
    );
  }

  const parsed = parseDispatchInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { input } = parsed;

  const receiving = await prisma.receivingEntry.findUnique({
    where: { id: receivingEntryId },
    include: { dispatches: true },
  });

  if (!receiving) {
    return NextResponse.json(
      { error: "Receiving entry not found." },
      { status: 404 },
    );
  }

  const { effectiveDue, status } = computeDue(receiving);

  if (status === "CLEARED") {
    return NextResponse.json(
      { error: "This receiving entry is already cleared." },
      { status: 400 },
    );
  }

  if (input.dispatchQty > effectiveDue) {
    return NextResponse.json(
      {
        error: `Cannot dispatch ${input.dispatchQty} drums. Only ${effectiveDue} remain on this order.`,
      },
      { status: 400 },
    );
  }

  const ceilingCheck = await checkStockCeiling(
    receiving.companyName,
    receiving.slipRingType,
    input.dispatchQty,
  );

  if (ceilingCheck.wouldExceed && !confirmOverDispatch) {
    return NextResponse.json(
      {
        requiresConfirmation: true,
        message: overDispatchMessage(ceilingCheck),
        ceilingCheck,
      },
      { status: 409 },
    );
  }

  const dispatch = await prisma.dispatchEntry.create({
    data: { ...input, receivingEntryId },
    include: { receivingEntry: { select: dispatchReceivingSelect } },
  });

  const updatedReceiving = await prisma.receivingEntry.findUnique({
    where: { id: receivingEntryId },
    include: { dispatches: true },
  });

  return NextResponse.json(
    {
      dispatch: serializeDispatch(dispatch),
      receiving: updatedReceiving
        ? enrichReceiving(updatedReceiving)
        : null,
      ceilingCheck,
    },
    { status: 201 },
  );
}
