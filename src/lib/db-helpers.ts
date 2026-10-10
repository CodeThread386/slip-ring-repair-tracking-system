import { prisma } from "@/lib/prisma";

export async function getAllReceivingWithDispatches() {
  return prisma.receivingEntry.findMany({
    include: { dispatches: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function getNextSno(): Promise<number> {
  const result = await prisma.receivingEntry.aggregate({
    _max: { sno: true },
  });
  return (result._max.sno ?? 0) + 1;
}

// Reuse the spelling already on record ("tata steel" -> "Tata Steel") so the
// same company never ends up split across two stock columns.
export async function normalizeCompanyName(
  raw: string,
  excludeId?: number,
): Promise<string> {
  const name = raw.trim().replace(/\s+/g, " ");
  const existing = await prisma.receivingEntry.findFirst({
    where: {
      companyName: { equals: name, mode: "insensitive" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
    select: { companyName: true },
    orderBy: { createdAt: "asc" },
  });
  return existing?.companyName ?? name;
}
