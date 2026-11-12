"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers, cookies } from "next/headers";
import { verifiedOrganizer, getAuth } from "../../server/auth";
import { isCalendarDate, normalize } from "../../domain/event";
import { getDb } from "../../server/db";
import { createEvent, changeStatus } from "../../server/events";

export async function create(form: FormData) {
  const user = await verifiedOrganizer();
  if (!user) redirect("/sign-in");
  const lines = (key: string) => String(form.get(key) ?? "").split(/\r?\n/u).map(line => line.trim()).filter(Boolean);
  await createEvent(user.id, {title:String(form.get("title") ?? ""),description:String(form.get("description") ?? ""),
    language:form.get("language") === "en" ? "en" : "da",dates:lines("dates"),ideas:lines("ideas"),timezone:String(form.get("timezone") ?? ""), votingDeadline:String(form.get("votingDeadline") ?? ""), rsvpDeadline:String(form.get("rsvpDeadline") ?? "")});
  revalidatePath("/organizer");
}

export async function transition(id: string, form: FormData) {
  const user = await verifiedOrganizer();
  if (!user) redirect("/sign-in");
  const next = form.get("next");
  if (next !== "VOTING_OPEN" && next !== "VOTING_CLOSED" && next !== "FINALIZED" && next !== "RSVP_OPEN" && next !== "COMPLETED") return;
  await changeStatus(user.id,id,next,{dateId:String(form.get("date") ?? ""),ideaId:String(form.get("idea") ?? ""),confirmed:form.get("confirmed")==="on",time:String(form.get("time") ?? ""),location:String(form.get("location") ?? ""),instructions:String(form.get("instructions") ?? "")});
  revalidatePath("/organizer");
}


export async function deleteEvent(id: string, form: FormData) {
  const user = await verifiedOrganizer();
  if (!user) redirect("/sign-in");
  if (form.get("confirmDelete") !== "on") return;
  await getDb().event.deleteMany({where:{id,ownerId:user.id}});
  revalidatePath("/organizer");
}

export async function removeBallot(id: string, form: FormData) {
  const user = await verifiedOrganizer();
  if (!user) redirect("/sign-in");
  if (form.get("confirmRemoval") !== "on") return;
  const ballotId = String(form.get("ballot") ?? "");
  await getDb().$transaction(async tx=>{
    const rows = await tx.$queryRaw<{status:string}[]>`SELECT status::text AS status FROM "Event" WHERE id = ${id} AND "ownerId" = ${user.id} FOR UPDATE`;
    if (rows[0]?.status !== "VOTING_OPEN" && rows[0]?.status !== "VOTING_CLOSED") return;
    const result = await tx.ballot.deleteMany({where:{id:ballotId,eventId:id}});
    if (result.count) await tx.auditLog.create({data:{eventId:id,actorId:user.id,action:"BALLOT_REMOVED",subjectId:ballotId}});
  });
  revalidatePath("/organizer");
}


export async function setRetention(id: string, form: FormData) {
  const user = await verifiedOrganizer();
  if (!user) redirect("/sign-in");
  const value = String(form.get("retention") ?? "");
  if (value && !isCalendarDate(value)) return;
  await getDb().event.updateMany({where:{id,ownerId:user.id},data:{retentionUntil:value?new Date(value+"T00:00:00Z"):null}});
  revalidatePath("/organizer");
}

export async function replaceRoster(id: string, form: FormData) {
  const user = await verifiedOrganizer();
  if (!user) redirect("/sign-in");
  const names = String(form.get("names") ?? "").split(/\r?\n/u).map(name=>name.trim()).filter(Boolean);
  if (names.length > 1000 || names.some(name=>name.length>100 || !normalize(name))) return;
  await getDb().$transaction(async tx=>{
    const rows = await tx.$queryRaw<{id:string}[]>`SELECT id FROM "Event" WHERE id = ${id} AND "ownerId" = ${user.id} FOR UPDATE`;
    if (!rows[0]) return;
    const invitees = new Map(names.map(name=>[normalize(name),name]));
    await tx.eventInvitee.deleteMany({where:{eventId:id}});
    await tx.eventInvitee.createMany({data:[...invitees].map(([normalizedName,name])=>({eventId:id,name,normalizedName}))});
    await tx.auditLog.create({data:{eventId:id,actorId:user.id,action:"ROSTER_REPLACED"}});
  });
  revalidatePath("/organizer");
}


export async function reopenVoting(id: string, form: FormData) {
  const user = await verifiedOrganizer();
  if (!user) redirect("/sign-in");
  if (form.get("confirmReopen") !== "on") return;
  await getDb().$transaction(async tx=>{
    const rows = await tx.$queryRaw<{id:string}[]>`SELECT id FROM "Event" WHERE id = ${id} AND "ownerId" = ${user.id} FOR UPDATE`;
    if (!rows[0]) return;
    const event = await tx.event.findUniqueOrThrow({where:{id}});
    if (event.status!=="VOTING_CLOSED" && !(event.status==="VOTING_OPEN" && event.votingDeadline && event.votingDeadline<=new Date())) return;
    await tx.event.update({where:{id},data:{status:"VOTING_OPEN",votingDeadline:null}});
    await tx.auditLog.create({data:{eventId:id,actorId:user.id,action:"VOTING_REOPENED"}});
  });
  revalidatePath("/organizer");
}

export async function closeRsvp(id: string) {
  const user = await verifiedOrganizer();
  if (!user) redirect("/sign-in");
  await getDb().$transaction(async tx=>{
    const result = await tx.event.updateMany({where:{id,ownerId:user.id,status:"RSVP_OPEN"},data:{status:"FINALIZED"}});
    if (result.count) await tx.auditLog.create({data:{eventId:id,actorId:user.id,action:"RSVP_CLOSED"}});
  });
  revalidatePath("/organizer");
}

export async function signOut() {
  await getAuth().api.signOut({headers:await headers()});
  const responseCookies = await cookies();
  for (const cookie of responseCookies.getAll()) {
    if (/^(?:__Secure-)?better-auth\.session_/u.test(cookie.name)) responseCookies.delete(cookie.name);
  }
  redirect("/sign-in");
}

