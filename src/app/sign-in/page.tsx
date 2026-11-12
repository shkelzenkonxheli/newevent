import { getLocale } from "next-intl/server";
import { SignInForm } from "./form";

export default async function SignIn({searchParams}:{searchParams:Promise<{token?:string}>}) {
  const en = await getLocale() === "en";
  return <main className="shell"><header>NewEvent</header><section className="event-card">
    <h1>{en?"Organizer account":"Arrangørkonto"}</h1>
    <SignInForm en={en} reset={Boolean((await searchParams).token)} google={Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)}/>
  </section></main>;
}

