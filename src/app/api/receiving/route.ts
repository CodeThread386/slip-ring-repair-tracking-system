import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enrichReceiving } from "@/lib/calculations";
import { getNextSno, normalizeCompanyName } from "@/lib/db-helpers";
import { parseReceivingInput } from "@/lib/receiving-input";

export async function POST(request: Request) {
  const parsed = parseReceivingInput(await request.json());
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const { input } = parsed;

  const receiving = await prisma.receivingEntry.create({
    data: {
      ...input,
      sno: await getNextSno(),
      companyName: await normalizeCompanyName(input.companyName),
    },
    include: { dispatches: true },
  });

  return NextResponse.json(enrichReceiving(receiving), { status: 201 });
}
