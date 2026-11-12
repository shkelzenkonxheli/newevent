import "dotenv/config";
import { getDb } from "../src/server/db.ts";

const db = getDb();
try {
  const where = {retentionUntil:{lte:new Date()}};
  if (process.argv.includes("--apply")) {
    const result = await db.event.deleteMany({where});
    console.log("Expired events deleted", result.count);
  } else {
    console.log("Expired events eligible for deletion", await db.event.count({where}));
  }
} finally {
  await db.$disconnect();
}
