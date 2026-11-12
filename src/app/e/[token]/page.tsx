import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { effectiveStatus } from "../../../domain/event";
import { getDb } from "../../../server/db";
import { setLanguage } from "../../language/actions";
import { RsvpForm } from "./rsvp-form";
import { BallotForm } from "./ballot-form";

export const dynamic = "force-dynamic";

export default async function PublicEvent({params}: {params:Promise<{token:string}>}) {
  const {token} = await params;
  if (!/^[\w-]{43}$/u.test(token)) notFound();
  const event = await getDb().event.findUnique({where: {publicToken:token}, select: {
    title:true, description:true, language:true, status:true, votingDeadline:true, rsvpDeadline:true,
    finalDate:true, finalIdea:true, finalTime:true, location:true, instructions:true,
    dates:{select:{id:true,date:true},orderBy:{date:"asc"}},
    ideas:{select:{id:true,label:true},orderBy:{label:"asc"}},
  }});
  if (!event || event.status === "DRAFT") notFound();
  const locale = ((await cookies()).get("locale")?.value ?? event.language) === "en" ? "en" : "da";
  const status = effectiveStatus(event.status, event.votingDeadline, event.rsvpDeadline, new Date());
  return <main className="shell" lang={locale}>
    <header>NewEvent<form action={setLanguage} className="language"><button name="locale" value="da" lang="da">Dansk</button><button name="locale" value="en" lang="en">English</button></form></header>
    <section className="event-card">
      <h1>{event.title}</h1><p>{event.description}</p>
      {status === "VOTING_OPEN" ? <BallotForm token={token} locale={locale} dates={event.dates} ideas={event.ideas}/> :
        status === "VOTING_CLOSED" ? <p>{locale === "en" ? "Voting has closed." : "Afstemningen er lukket."}</p> :
        <><h2>{event.finalIdea}</h2><p>{event.finalDate && new Intl.DateTimeFormat(locale, {dateStyle:"long", timeZone:"UTC"}).format(new Date(event.finalDate+"T00:00:00Z"))} {event.finalTime}</p><p>{event.location}</p><p>{event.instructions}</p>{status === "RSVP_OPEN" && <RsvpForm token={token} en={locale === "en"}/>}</>}
    </section>
    <footer><a href="/privacy">{locale === "en" ? "Privacy" : "Privatliv"}</a></footer>
  </main>;
}


