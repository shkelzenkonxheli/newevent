"use client";

import { useActionState } from "react";
import { vote } from "./actions";

const copy = {
  da: {name:"Fulde navn", dates:"Datoer", ideas:"Aktiviteter", addDate:"Nye datoer (ÅÅÅÅ-MM-DD, én pr. linje)", addIdea:"Nye idéer (én pr. linje)", token:"Privat kode til at ændre en tidligere stemme", submit:"Gem stemme", saved:"Din stemme er gemt.", keep:"Gem denne private kode, hvis du vil ændre din stemme eller senere svare på invitationen.", duplicate:"Der er allerede en stemme med dette navn.", closed:"Afstemningen er lukket.", invalid:"Vælg eller foreslå mindst én gyldig mulighed.", private:"Den private kode kunne ikke bruges.", limited:"Der er mange forsøg lige nu. Vent et minut.", unexpected:"Stemmen kunne ikke gemmes. Prøv igen."},
  en: {name:"Full name", dates:"Dates", ideas:"Activities", addDate:"New dates (YYYY-MM-DD, one per line)", addIdea:"New ideas (one per line)", token:"Private code to replace a previous ballot", submit:"Save vote", saved:"Your vote was saved.", keep:"Keep this private code to change your vote or respond to the invitation later.", duplicate:"A ballot with this name already exists.", closed:"Voting has closed.", invalid:"Select or propose at least one valid option.", private:"The private code could not be used.", limited:"Too many attempts. Wait a minute and try again.", unexpected:"Your vote could not be saved. Try again."},
};

export function BallotForm({token, locale, dates, ideas}: {token:string;locale:"da"|"en";dates:{id:string;date:string}[];ideas:{id:string;label:string}[]}) {
  const [state, action, pending] = useActionState(vote.bind(null, token), {});
  const t = copy[locale];
  if (state.saved) return <section role="status"><h2>{t.saved}</h2>{state.privateToken && <><p>{t.keep}</p><code className="capability">{state.privateToken}</code></>}</section>;
  return <form action={action} className="stack">
    <label>{t.name}<input name="name" autoComplete="name" maxLength={100}/></label>
    <fieldset><legend>{t.dates}</legend>{dates.map(option => <label className="choice" key={option.id}><input type="checkbox" name="date" value={option.id}/> {new Intl.DateTimeFormat(locale, {dateStyle:"long", timeZone:"UTC"}).format(new Date(option.date+"T00:00:00Z"))}</label>)}
      <label>{t.addDate}<textarea name="newDates" maxLength={150}/></label>
    </fieldset>
    <fieldset><legend>{t.ideas}</legend>{ideas.map(option => <label className="choice" key={option.id}><input type="checkbox" name="idea" value={option.id}/> {option.label}</label>)}
      <label>{t.addIdea}<textarea name="newIdeas" maxLength={1650}/></label>
    </fieldset>
    <label>{t.token}<input name="privateToken" type="password" autoComplete="off" maxLength={43}/></label>
    {state.code && <p role="alert">{t[state.code as keyof typeof t] ?? t.unexpected}</p>}
    <button disabled={pending}>{t.submit}</button>
  </form>;
}

