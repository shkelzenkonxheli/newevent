import "dotenv/config";
import {getDb} from "../src/server/db.ts";

const database = process.env.DATABASE_URL;
const email = process.env.SEED_ORGANIZER_EMAIL;
if (!database || !["localhost","127.0.0.1","[::1]"].includes(new URL(database).hostname) || !email || process.env.NODE_ENV !== "development") {
  throw new Error("Seed requires NODE_ENV=development, a loopback database and SEED_ORGANIZER_EMAIL");
}
const db = getDb();
try {
  const user = await db.user.findUnique({where:{email}});
  if (!user?.emailVerified) throw new Error("Verify the local organizer account before seeding");
  const id = "newevent-local-demo-"+user.id;
  await db.event.upsert({where:{id},update:{},create:{
    id,ownerId:user.id,publicToken:"local-demo-only-"+id.padEnd(27,"0").slice(-27),
    title:"Forårsaften",description:"Vælg en dag og en aktivitet til vores fælles aften.",
    status:"VOTING_OPEN",dates:{create:[{date:"2030-05-03"},{date:"2030-05-10"}]},
    ideas:{create:[{label:"Fællesspisning",normalizedLabel:"fællesspisning"},{label:"Brætspil",normalizedLabel:"brætspil"}]},
  }});
} finally {
  await db.$disconnect();
}

