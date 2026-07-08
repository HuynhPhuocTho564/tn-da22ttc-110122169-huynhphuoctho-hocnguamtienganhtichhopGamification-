import { PrismaClient } from "@prisma/client";
async function main() {
  const p = new PrismaClient();
  const ex = await p.exercise.findUnique({
    where: { id: "ex-map-t1-g01-i-ih-listen_choose" },
    select: {
      id: true,
      name: true,
      questions: {
        where: { status: "ACTIVE" },
        select: { id: true, content: true, typeId: true },
      },
    },
  });
  if (ex) {
    for (const q of ex.questions) {
      const c = JSON.parse(q.content);
      console.log(`${q.id} | type=${q.typeId} | audioUrl=${c.audioUrl ?? "MISSING"} | word=${c.word ?? "?"}`);
    }
  }
  await p.$disconnect();
}
main();
