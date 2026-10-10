import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed file intentionally does not insert business rows.
  // Slip ring types are suggested in the UI only; stock is always computed from the log.
  console.log("No database rows seeded. Types are provided in the UI datalist.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
