import { db } from "../lib/db";
import { leadHistory, leadMessages, leads } from "../lib/db/schema";

async function main() {
  const historyDeleted = await db.delete(leadHistory).returning();
  console.log(`lead_history: ${historyDeleted.length} linha(s) apagada(s)`);

  const messagesDeleted = await db.delete(leadMessages).returning();
  console.log(`lead_messages: ${messagesDeleted.length} linha(s) apagada(s)`);

  const leadsDeleted = await db.delete(leads).returning();
  console.log(`leads: ${leadsDeleted.length} linha(s) apagada(s)`);

  console.log("Concluído.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Erro ao apagar leads:", err);
  process.exit(1);
});