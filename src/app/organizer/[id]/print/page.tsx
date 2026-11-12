import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { verifiedOrganizer } from "../../../../server/auth";
import { getDb } from "../../../../server/db";
import { PrintButton } from "./print-button";

export default async function PrintPage({params,searchParams}:{params:Promise<{id:string}>;searchParams:Promise<{report?:string;names?:string}>}) {
  const user = await verifiedOrganizer();
  if (!user) notFound();
  const {id} = await params;
  const {report,names} = await searchParams;
  const event = await getDb().event.findFirst({where:{id,ownerId:user.id},include:{
    dates:{include:{_count:{select:{votes:true}}}},
    ideas:{include:{_count:{select:{votes:true}}}},
    participants:{include:{ballot:{select:{id:true}},rsvp:{select:{attending:true}}},orderBy:{name:"asc"}},
  }});
  if (!event) notFound();
  const locale = await getLocale();
  const en = locale === "en";
  const title = report==="votes"?(en?"Voting summary":"Afstemningsoversigt"):report==="attendance"?(en?"Attendance report":"Deltageroversigt"):(en?"Event announcement":"Invitation");
  const ballots = event.participants.filter(person=>person.ballot);
  const groups = [
    {label:en?"Yes":"Ja", people:event.participants.filter(person=>person.rsvp?.attending===true)},
    {label:en?"No":"Nej", people:event.participants.filter(person=>person.rsvp?.attending===false)},
    {label:en?"Pending (voters)":"Afventer (vælgere)", people:ballots.filter(person=>!person.rsvp)},
  ];
  return <main className="shell print-page">
    <header>NewEvent</header>
    <h1>{event.title}</h1><h2>{title}</h2>
    <p>{new Intl.DateTimeFormat(locale,{dateStyle:"medium",timeStyle:"short",timeZone:event.timezone}).format(new Date())}</p>
    {(report==="votes"||report==="attendance") && <a className="no-print" href={"?report="+report+(names==="yes"?"":"&names=yes")}>{names==="yes"?(en?"Hide names":"Skjul navne"):(en?"Include names":"Medtag navne")}</a>}
    <PrintButton label={en?"Print or save as PDF":"Udskriv eller gem som PDF"}/>
    {report==="votes" ? <>
      <p>{en?"Unique voters":"Unikke vælgere"} · {ballots.length}</p>
      <ul>{event.dates.map(row=><li key={row.id}>{row.date} · {row._count.votes}</li>)}
      {event.ideas.map(row=><li key={row.id}>{row.label} · {row._count.votes}</li>)}</ul>
      {names==="yes" && <ul>{ballots.map(person=><li key={person.id}>{person.name}</li>)}</ul>}
    </> : report==="attendance" ? groups.map(group=><section key={group.label}>
      <h3>{group.label} · {group.people.length}</h3>
      {names==="yes" && <ul>{group.people.map(person=><li key={person.id}>{person.name}</li>)}</ul>}
    </section>) : <>
      <p>{event.finalDate && new Intl.DateTimeFormat(locale,{dateStyle:"full",timeZone:"UTC"}).format(new Date(event.finalDate+"T00:00:00Z"))} {event.finalTime}</p>
      <p>{event.finalIdea}</p><p>{event.location}</p><p>{event.description}</p><p>{event.instructions}</p>
      {/* eslint-disable-next-line @next/next/no-img-element -- Authenticated PNG must bypass the image optimizer. */}
      <img src={"/organizer/"+id+"/qr"} alt={en?"QR code for the event":"QR-kode til arrangementet"} width={184} height={184}/>
    </>}
  </main>;
}

