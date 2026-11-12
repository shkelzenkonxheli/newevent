import { effectiveStatus, normalize } from "../domain/event";
import { EventError, lockEvent } from "./ballots";
import { createCapability, hashCapability } from "./capability";
import { getDb } from "./db";

export async function saveRsvp(eventToken: string, name: string, privateToken: string, attending: boolean) {
  const normalizedName = normalize(name);
  if ((!privateToken && (!normalizedName || name.length > 100)) || (privateToken && !/^[\w-]{43}$/u.test(privateToken))) {
    throw new EventError("invalid");
  }
  return getDb().$transaction(async tx => {
    const event = await lockEvent(tx, eventToken);
    if (effectiveStatus(event.status,event.votingDeadline,event.rsvpDeadline,new Date()) !== "RSVP_OPEN") {
      throw new EventError("closed");
    }
    const where = {eventId:event.id, normalizedName};
    let participant = privateToken ? await tx.participant.findFirst({
      where:{eventId:event.id,tokenHash:hashCapability(privateToken)},
    }) : null;
    if (privateToken && !participant) throw new EventError("private");
    let newToken: string | undefined;
    if (!participant) {
      if (await tx.participant.findUnique({where:{eventId_normalizedName:where}})) throw new EventError("duplicate");
      newToken = createCapability();
      participant = await tx.participant.create({data:{...where,name:name.trim(),tokenHash:hashCapability(newToken)}});
    }
    const key = {eventId:event.id,participantId:participant.id};
    await tx.rSVP.upsert({where:{eventId_participantId:key},create:{...key,attending},update:{attending}});
    return newToken;
  });
}
