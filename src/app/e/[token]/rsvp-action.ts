"use server";

import { allowPublicWrite } from "../../../server/public-limit";
import { EventError } from "../../../server/ballots";
import { saveRsvp } from "../../../server/rsvp";

export type RsvpState = {saved?:boolean; privateToken?:string; error?:string};

export async function respond(token:string,_previous:RsvpState,form:FormData):Promise<RsvpState> {
  const answer = form.get("answer");
  if (answer !== "yes" && answer !== "no") return {error:"invalid"};
  try {
    if (!await allowPublicWrite(token)) return {error:"limited"};
    const privateToken = await saveRsvp(token,String(form.get("name")??""),String(form.get("privateToken")??"").trim(),answer==="yes");
    return {saved:true, privateToken};
  } catch (error) {
    return {error:error instanceof EventError ? error.code : "unexpected"};
  }
}

