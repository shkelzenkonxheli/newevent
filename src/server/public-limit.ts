import { getDb } from "./db";

export async function allowPublicWrite(token: string): Promise<boolean> {
  if (!/^[\w-]{43}$/u.test(token)) return false;
  const db = getDb();
  const event = await db.event.findUnique({where:{publicToken:token},select:{id:true}});
  if (!event) return false;
  const rows = await db.$queryRaw<{hits:number}[]>`
    INSERT INTO "PublicWriteLimit" ("key", "hits", "resetAt") VALUES (${event.id}, 1, now() + interval '1 minute')
    ON CONFLICT ("key") DO UPDATE SET
      "hits" = CASE WHEN "PublicWriteLimit"."resetAt" <= now() THEN 1 ELSE LEAST("PublicWriteLimit"."hits" + 1, 121) END,
      "resetAt" = CASE WHEN "PublicWriteLimit"."resetAt" <= now() THEN now() + interval '1 minute' ELSE "PublicWriteLimit"."resetAt" END
    RETURNING "hits"`;
  return rows[0].hits <= 120;
}
