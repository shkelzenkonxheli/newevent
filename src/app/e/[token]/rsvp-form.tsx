"use client";

import { useActionState } from "react";
import { respond } from "./rsvp-action";

export function RsvpForm({token,en}:{token:string;en:boolean}) {
  const [state, action, pending] = useActionState(respond.bind(null,token),{});
  if (state.saved) return <div role="status"><p>{en?"Your reply is saved.":"Dit svar er gemt."}</p>{state.privateToken && <>
    <p>{en?"Keep this private code to change your reply.":"Gem denne private kode, hvis du vil ændre dit svar."}</p>
    <code className="capability">{state.privateToken}</code>
  </>}</div>;
  return <form action={action} className="stack">
    <h2>{en?"Can you join?":"Kommer du?"}</h2>
    <label>{en?"Full name":"Fulde navn"}<input name="name" autoComplete="name" maxLength={100}/></label>
    <label>{en?"Private code if you voted or already replied":"Privat kode, hvis du har stemt eller allerede har svaret"}<input name="privateToken" type="password" autoComplete="off" maxLength={43}/></label>
    <button name="answer" value="yes" disabled={pending}>{en?"Yes, I’m coming":"Ja, jeg kommer"}</button>
    <button name="answer" value="no" disabled={pending}>{en?"No, I can’t come":"Nej, jeg kan ikke komme"}</button>
    {state.error && <p role="alert">{state.error==="duplicate" ? (en?"Use your private code to reply.":"Brug din private kode til at svare.") : (en?"Your reply could not be saved.":"Dit svar kunne ikke gemmes.")}</p>}
  </form>;
}
