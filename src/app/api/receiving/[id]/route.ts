import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { computeDue, enrichReceiving } from "@/lib/calculations";
import { normalizeCompanyName } from "@/lib/db-helpers";
import { parseReceivingInput } from "@/lib/receiving-input";

type RouteParams = { params: Promise<{ id: string }> };

async function parseId(params: RouteParams["params"]) {
  const id = Number((await params).id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  const id = await parseId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Invalid receiving entry id." },
      { status: 400 },
    );
  }

  const parsed = parseReceivingInput(await request.json());
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { input } = parsed;

  const existing = await prisma.receivingEntry.findUnique({
    where: { id },
    include: { dispatches: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Receiving entry not found." },
      { status: 404 },
    );
  }

  if (existing.isAdjustment) {
    return NextResponse.json(
      { error: "Stock adjustments can't be edited. Delete it and add a new one." },
      { status: 400 },
    );
  }

  const { totalDispatched } = computeDue(existing);
  if (input.qtyReceived < totalDispatched) {
    return NextResponse.json(
      {
        error: `${totalDispatched} drums are already dispatched on this order, so the quantity can't be lower than that.`,
      },
      { status: 400 },
    );
  }

  const updated = await prisma.receivingEntry.update({
    where: { id },
    data: {
      ...input,
      companyName: await normalizeCompanyName(input.companyName, id),
    },
    include: { dispatches: true },
  });

  return NextResponse.json(enrichReceiving(updated));
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  const id = await parseId(params);
  if (!id) {
    return NextResponse.json(
      { error: "Invalid receiving entry id." },
      { status: 400 },
    );
  }

  const receiving = await prisma.receivingEntry.findUnique({
    where: { id },
    include: { _count: { select: { dispatches: true } } },
  });

  if (!receiving) {
    return NextResponse.json(
      { error: "Receiving entry not found." },
      { status: 404 },
    );
  }

  const dispatchCount = receiving._count.dispatches;
  if (dispatchCount > 0) {
    return NextResponse.json(
      {
        error: `S.No ${receiving.sno} has ${dispatchCount} dispatch ${
          dispatchCount === 1 ? "entry" : "entries"
        } against it. Delete ${dispatchCount === 1 ? "that" : "those"} first.`,
      },
      { status: 409 },
    );
  }

  await prisma.receivingEntry.delete({ where: { id } });

  return NextResponse.json({ deletedId: id });
}
