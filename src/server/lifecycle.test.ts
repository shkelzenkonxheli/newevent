import { expect, test } from "vitest";
import { createEvent, changeStatus } from "./events";
import { saveBallot } from "./ballots";
import { saveRsvp } from "./rsvp";
import { getDb } from "./db";
import { allowPublicWrite } from "./public-limit";
import { createCapability } from "./capability";

test.skipIf(process.env.NEWEVENT_DATABASE_TEST !== "1")("event lifecycle, concurrency and participant capabilities",async ()=>{
  const url = process.env.DATABASE_URL;
  if (!url || !["localhost","127.0.0.1","[::1]"].includes(new URL(url).hostname)) {
    throw new Error("Use a dedicated local PostgreSQL database for this test");
  }
  const db = getDb();
  const id = createCapability();
  const owner = await db.user.create({data:{id,name:"Test organizer",email:id+"@example.invalid",emailVerified:true}});
  const outsider = await db.user.create({data:{id:id+"x",name:"Test outsider",email:id+"x@example.invalid",emailVerified:true}});
  try {
    const event = await createEvent(owner.id,{title:"Test event",description:"",language:"en",timezone:"Europe/Copenhagen",votingDeadline:"",rsvpDeadline:"",dates:[],ideas:[]});
    const row = await db.event.findUniqueOrThrow({where:{id:event.id},include:{dates:true,ideas:true}});
    expect(row.dates).toHaveLength(0);
    expect(row.ideas).toHaveLength(0);
    await expect(changeStatus(outsider.id,event.id,"VOTING_OPEN")).rejects.toThrow("missing");
    await changeStatus(owner.id,event.id,"VOTING_OPEN");
    const ballot = {name:"Anna Test",dateIds:[],ideaIds:[],newDates:["2030-05-01","2030-05-02"],newIdeas:["Dinner","  dinner  ","Board games"]};
    const submissions = await Promise.allSettled([
      saveBallot(row.publicToken,ballot),
      saveBallot(row.publicToken,{...ballot,name:" ANNA  TEST "}),
    ]);
    const winner = submissions.find(result=>result.status==="fulfilled");
    expect(winner?.status).toBe("fulfilled");
    expect(submissions.filter(result=>result.status==="rejected")).toHaveLength(1);
    if (winner?.status!=="fulfilled" || !winner.value.privateToken) throw new Error("No private token");
    const token = winner.value.privateToken;
    expect(await db.dateVote.count({where:{eventId:event.id}})).toBe(2);
    expect(await db.ideaVote.count({where:{eventId:event.id}})).toBe(2);
    await expect(saveBallot(row.publicToken,ballot)).rejects.toThrow("duplicate");
    const date = await db.eventDateProposal.findFirstOrThrow({where:{eventId:event.id}});
    const idea = await db.eventIdeaProposal.findFirstOrThrow({where:{eventId:event.id}});
    await saveBallot(row.publicToken,{...ballot,privateToken:token,dateIds:[date.id],newDates:[],newIdeas:["Walk"]});
    expect(await db.dateVote.count({where:{eventId:event.id}})).toBe(1);
    const later = await saveBallot(row.publicToken,{name:"Second Voter",dateIds:[date.id],ideaIds:[idea.id],newDates:["2030-05-03"],newIdeas:["Picnic"]});
    expect(later.privateToken).toBeTruthy();
    expect(await db.ballot.count({where:{eventId:event.id}})).toBe(2);
    expect(await allowPublicWrite(row.publicToken)).toBe(true);
    await db.publicWriteLimit.update({where:{key:event.id},data:{hits:120}});
    expect(await allowPublicWrite(row.publicToken)).toBe(false);
    await changeStatus(owner.id,event.id,"VOTING_CLOSED");
    await expect(saveBallot(row.publicToken,{...ballot,privateToken:token})).rejects.toThrow("closed");
    await changeStatus(owner.id,event.id,"FINALIZED",{dateId:date.id,ideaId:idea.id,confirmed:true,time:"",location:"",instructions:""});
    await changeStatus(owner.id,event.id,"RSVP_OPEN");
    await expect(saveRsvp(row.publicToken,"Anna Test","",true)).rejects.toThrow("duplicate");
    await saveRsvp(row.publicToken,"",token,true);
    const guest = await saveRsvp(row.publicToken,"Guest Test","",false);
    expect(guest).toBeTruthy();
    expect(await db.rSVP.count({where:{eventId:event.id,attending:true}})).toBe(1);
    expect(await db.rSVP.count({where:{eventId:event.id,attending:false}})).toBe(1);
    await changeStatus(owner.id,event.id,"COMPLETED");
    await expect(saveRsvp(row.publicToken,"",token,false)).rejects.toThrow("closed");
  } finally {
    await db.user.deleteMany({where:{id:{in:[owner.id,outsider.id]}}});
    await db.$disconnect();
  }
},30000);

