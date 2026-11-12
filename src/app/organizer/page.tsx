import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { verifiedOrganizer } from "../../server/auth";
import { getDb } from "../../server/db";
import { effectiveStatus } from "../../domain/event";
import { EventWizard } from "./wizard";
import { transition, deleteEvent, removeBallot, replaceRoster, setRetention, reopenVoting, closeRsvp, signOut } from "./actions";

export const dynamic = "force-dynamic";

export default async function Organizer({searchParams}:{searchParams:Promise<{q?:string}>}) {
  const user = await verifiedOrganizer();
  if (!user) redirect("/sign-in");
  const en = await getLocale() === "en";
  const rawQuery = (await searchParams).q;
  const query = typeof rawQuery === "string" ? rawQuery.slice(0,140) : "";
  const events = await getDb().event.findMany({where:{ownerId:user.id,...(query?{title:{contains:query,mode:"insensitive"}}:{})},orderBy:{createdAt:"desc"},include:{
    invitees:{orderBy:{name:"asc"}},
    participants:{select:{id:true,name:true,normalizedName:true,ballot:{select:{id:true}},rsvp:{select:{attending:true}}}},
    dates:{include:{_count:{select:{votes:true}}}},
    ideas:{include:{_count:{select:{votes:true}}}},
  }});
  const statuses = {DRAFT:en?"Draft":"Kladde",VOTING_OPEN:en?"Voting open":"Afstemning åben",VOTING_CLOSED:en?"Voting closed":"Afstemning lukket",
    FINALIZED:en?"Finalized":"Planlagt",RSVP_OPEN:en?"RSVP open":"Tilmelding åben",COMPLETED:en?"Completed":"Afsluttet"};
  return <main className="shell"><header>NewEvent<form className="language" action={signOut}><button>{en?"Sign out":"Log ud"}</button></form></header><section className="event-card">
    <h1>{en?"Your events":"Dine arrangementer"}</h1>
    <h2>{en?"Create an event":"Opret et arrangement"}</h2>
    <EventWizard en={en}/>
    </section><section className="stack">
    <form className="stack"><label>{en?"Search events":"Søg efter arrangementer"}<input name="q" defaultValue={query} maxLength={140}/></label><button>{en?"Search":"Søg"}</button></form>
    {events.length===0 && <p>{en?"No events to show.":"Ingen arrangementer at vise."}</p>}
    {events.map(event=>{
      const status = effectiveStatus(event.status,event.votingDeadline,event.rsvpDeadline,new Date());
      const next = {DRAFT:"VOTING_OPEN",VOTING_OPEN:"VOTING_CLOSED",VOTING_CLOSED:"FINALIZED",FINALIZED:"RSVP_OPEN",RSVP_OPEN:"COMPLETED",COMPLETED:null}[status];
      const dates = event.dates.sort((a,b)=>b._count.votes-a._count.votes || a.date.localeCompare(b.date));
      const ideas = event.ideas.sort((a,b)=>b._count.votes-a._count.votes || a.label.localeCompare(b.label));
      return <article key={event.id}>
        <h2>{event.title}</h2><p>{statuses[status]}</p>
        {event.status!=="DRAFT" && <a href={"/e/"+event.publicToken}>{en?"Open public link":"Åbn offentligt link"}</a>}
        <div><a href={"/organizer/"+event.id+"/qr?download"}>{en?"Download QR":"Hent QR"}</a> <a href={"/organizer/"+event.id+"/print"}>{en?"Print announcement":"Udskriv invitation"}</a> <a href={"/organizer/"+event.id+"/print?report=votes"}>{en?"Voting summary":"Afstemningsoversigt"}</a> <a href={"/organizer/"+event.id+"/print?report=attendance"}>{en?"Attendance report":"Deltageroversigt"}</a></div><p>{en?"Participants can choose multiple options.":"Deltagerne kan vælge flere muligheder."}</p>
        <p>{en?"Unique voters":"Unikke vælgere"} · {event.participants.filter(person=>person.ballot).length}</p>
        {event.invitees.length>0 && <p>{en?"Invited voters":"Inviterede, der har stemt"} · {event.invitees.filter(invitee=>event.participants.some(person=>person.normalizedName===invitee.normalizedName && person.ballot)).length} / {event.invitees.length}</p>}
        <p>{en?"Yes":"Ja"} · {event.participants.filter(person=>person.rsvp?.attending===true).length} / {en?"No":"Nej"} · {event.participants.filter(person=>person.rsvp?.attending===false).length} / {en?"Pending (voters)":"Afventer (vælgere)"} · {event.participants.filter(person=>person.ballot&&!person.rsvp).length}</p>
        <ul>{dates.map(row=><li key={row.id}>{row.date} · {row._count.votes}</li>)}{ideas.map(row=><li key={row.id}>{row.label} · {row._count.votes}</li>)}</ul>
        {next && <form action={transition.bind(null,event.id)} className="stack">
          {next==="FINALIZED" && <>
            <label>{en?"Final date":"Endelig dato"}<select name="date" required><option value=""/>{dates.map(row=><option key={row.id} value={row.id}>{row.date}</option>)}</select></label>
            <label>{en?"Final activity":"Endelig aktivitet"}<select name="idea" required><option value=""/>{ideas.map(row=><option key={row.id} value={row.id}>{row.label}</option>)}</select></label>
            <label>{en?"Time":"Tidspunkt"}<input name="time" type="time"/></label>
            <label>{en?"Location":"Sted"}<input name="location" maxLength={240}/></label>
            <label>{en?"Final instructions":"Praktiske oplysninger"}<textarea name="instructions" maxLength={4000}/></label>
            <label className="choice"><input name="confirmed" type="checkbox" required/>{en?"Confirm final selection":"Bekræft den endelige plan"}</label>
          </>}
          <button name="next" value={next}>{statuses[next as keyof typeof statuses]}</button>
        </form>}
        {event.status==="RSVP_OPEN" && <form className="stack" action={closeRsvp.bind(null,event.id)}><button>{en?"Close RSVP":"Luk tilmelding"}</button></form>}
        {status==="VOTING_CLOSED" && <form className="stack" action={reopenVoting.bind(null,event.id)}>
          <label className="choice"><input name="confirmReopen" type="checkbox" required/>{en?"Keep ballots and reopen without a deadline":"Behold stemmer og genåbn uden tidsfrist"}</label>
          <button>{en?"Reopen voting":"Genåbn afstemning"}</button>
        </form>}
        <details><summary>{en?"Manage event data":"Administrér arrangementsdata"}</summary>
          <form className="stack" action={replaceRoster.bind(null,event.id)}>
            <label>{en?"Invitee roster (one name per line)":"Gæsteliste (ét navn pr. linje)"}<textarea name="names" defaultValue={event.invitees.map(person=>person.name).join("\n")} maxLength={101000}/></label>
            <button>{en?"Save roster":"Gem gæsteliste"}</button>
          </form>
          <form className="stack" action={setRetention.bind(null,event.id)}>
            <label>{en?"Delete on or after this date (UTC)":"Slet fra denne dato (UTC)"}<input name="retention" type="date" defaultValue={event.retentionUntil?.toISOString().slice(0,10)}/></label>
            <button>{en?"Save retention date":"Gem sletningsdato"}</button>
          </form>
          <a href={"/organizer/"+event.id+"/export"}>{en?"Export event data":"Eksportér arrangementsdata"}</a>
          {(status==="VOTING_OPEN" || status==="VOTING_CLOSED") && event.participants.some(person=>person.ballot) && <form className="stack" action={removeBallot.bind(null,event.id)}>
            <label>{en?"Ballot":"Stemme"}<select name="ballot" required><option value=""/>{event.participants.filter(person=>person.ballot).map(person=><option key={person.id} value={person.ballot?.id}>{person.name}</option>)}</select></label>
            <label className="choice"><input name="confirmRemoval" type="checkbox" required/>{en?"Confirm removal":"Bekræft fjernelse"}</label>
            <button>{en?"Remove ballot":"Fjern stemme"}</button>
          </form>}
          <form className="stack" action={deleteEvent.bind(null,event.id)}><label className="choice"><input name="confirmDelete" type="checkbox" required/>{en?"Permanently delete event and participant data":"Slet arrangement og deltagerdata permanent"}</label><button>{en?"Delete event":"Slet arrangement"}</button></form>
        </details>
      </article>;
    })}</section>
  </main>;
}










