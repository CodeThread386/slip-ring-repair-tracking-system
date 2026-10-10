import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeDue, dispatchReceivingSelect, serializeDispatch } from "@/lib/calculations";
import { parseDispatchInput } from "@/lib/dispatch-input";
import { checkStockCeiling, overDispatchMessage } from "@/lib/stock-check";

type RouteParams = { params: Promise<{ id: string }> };

async function parseId(params: RouteParams["params"]) {
  const id = Number((await params).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const id = await parseId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Invalid dispatch entry id." },
      { status: 400 },
    );
  }

  const body = await request.json();
  const parsed = parseDispatchInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { input } = parsed;

  const existing = await prisma.dispatchEntry.findUnique({
    where: { id },
    include: { receivingEntry: { include: { dispatches: true } } },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Dispatch entry not found." },
      { status: 404 },
    );
  }

  const receiving = existing.receivingEntry;
  const available = computeDue(receiving).effectiveDue + existing.dispatchQty;
  if (input.dispatchQty > available) {
    return NextResponse.json(
      {
        error: `Cannot dispatch ${input.dispatchQty} drums. Only ${available} are available on this order.`,
      },
      { status: 400 },
    );
  }

  const extraQty = input.dispatchQty - existing.dispatchQty;
  if (extraQty > 0 && !body.confirmOverDispatch) {
    const ceilingCheck = await checkStockCeiling(
      receiving.companyName,
      receiving.slipRingType,
      extraQty,
    );
    if (ceilingCheck.wouldExceed) {
      return NextResponse.json(
        {
          requiresConfirmation: true,
          message: overDispatchMessage(ceilingCheck),
          ceilingCheck,
        },
        { status: 409 },
      );
    }
  }

  const updated = await prisma.dispatchEntry.update({
    where: { id },
    data: input,
    include: { receivingEntry: { select: dispatchReceivingSelect } },
  });

  return NextResponse.json(serializeDispatch(updated));
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const id = await parseId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Invalid dispatch entry id." },
      { status: 400 },
    );
  }

  const { count } = await prisma.dispatchEntry.deleteMany({ where: { id } });

  if (count === 0) {
    return NextResponse.json(
      { error: "Dispatch entry not found." },
      { status: 404 },
    );
  }

  return NextResponse.json({ deletedId: id });
}
