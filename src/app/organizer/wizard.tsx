"use client";

import { useRef, useState } from "react";
import { create } from "./actions";

export function EventWizard({en}:{en:boolean}) {
  const [step,setStep] = useState(0);
  const [failed,setFailed] = useState(false);
  const title = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const steps = en?["Event details","Initial proposals","Participation"]:["Om arrangementet","Forslag","Deltagelse"];
  function goTo(next:number) {
    if (next > step && step===0 && !title.current?.reportValidity()) return;
    setStep(next);
    heading.current?.focus();
  }
  async function submit(form:FormData) {
    setFailed(false);
    try {
      await create(form);
      setStep(0);
    } catch {
      setFailed(true);
    }
  }
  return <form action={submit} className="stack" onSubmit={event=>{if(step!==2){event.preventDefault();goTo(step+1);}}}>
    <h3 ref={heading} tabIndex={-1}>{steps[step]}</h3>
    <div className="wizard-step" hidden={step!==0}>
      <label>{en?"Title":"Titel"}<input ref={title} name="title" required maxLength={140}/></label>
      <label>{en?"Description":"Beskrivelse"}<textarea name="description" maxLength={4000}/></label>
      <label>{en?"Event language":"Arrangementets sprog"}<select name="language" defaultValue={en?"en":"da"}><option value="da">Dansk</option><option value="en">English</option></select></label>
    </div>
    <div className="wizard-step" hidden={step!==1}>
      <p>{en?"You can leave both fields empty and let guests make the first suggestions.":"Du kan lade begge felter stå tomme og lade gæsterne komme med de første forslag."}</p>
      <label>{en?"Dates (YYYY-MM-DD, one per line)":"Datoer (ÅÅÅÅ-MM-DD, én pr. linje)"}<textarea name="dates" maxLength={240}/></label>
      <label>{en?"Ideas (one per line)":"Idéer (én pr. linje)"}<textarea name="ideas" maxLength={3300}/></label>
    </div>
    <div className="wizard-step" hidden={step!==2}>
      <label>{en?"Event time zone":"Arrangementets tidszone"}<input name="timezone" defaultValue="Europe/Copenhagen" maxLength={80}/></label>
      <label>{en?"Voting deadline (optional)":"Afstemningsfrist (valgfri)"}<input name="votingDeadline" type="datetime-local"/></label>
      <label>{en?"RSVP deadline (optional)":"Svarfrist (valgfri)"}<input name="rsvpDeadline" type="datetime-local"/></label>
    </div>
    {failed && <p role="alert">{en?"Check the dates, time zone and deadlines, then try again.":"Tjek datoerne, tidszonen og fristerne, og prøv igen."}</p>}
    <div className="wizard-nav">
      {step>0 && <button type="button" onClick={()=>goTo(step-1)}>{en?"Back":"Tilbage"}</button>}
      {step<2 ? <button type="button" onClick={()=>goTo(step+1)}>{en?"Continue":"Fortsæt"}</button> : <button>{en?"Create draft":"Opret kladde"}</button>}
    </div>
  </form>;
}

