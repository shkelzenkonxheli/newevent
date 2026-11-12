import Link from "next/link";
import {getLocale} from "next-intl/server";

export default async function NotFound() {
  const en = await getLocale()==="en";
  return <main className="shell"><header>NewEvent</header><section className="event-card">
    <h1>{en?"Link unavailable":"Linket er ikke tilgængeligt"}</h1>
    <p>{en?"Check the event link with your organizer.":"Tjek linket til arrangementet med din arrangør."}</p>
    <Link href="/">{en?"Home":"Forside"}</Link>
  </section></main>;
}

