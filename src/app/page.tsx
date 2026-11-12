import { CalendarDays, CircleCheck, ScanLine, Sparkles } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { setLanguage } from "./language/actions";

export default async function Home() {
  const t = await getTranslations();
  const locale = await getLocale();
  return <main className="shell">
    <header><Sparkles aria-hidden="true" size={20}/> NewEvent
      <form action={setLanguage} className="language">
        <button name="locale" value="da" lang="da" aria-pressed={locale === "da"}>Dansk</button>
        <button name="locale" value="en" lang="en" aria-pressed={locale === "en"}>English</button>
      </form>
    </header>
    <section className="hero">
      <div><h1>{t("lead")}</h1><p>{t("intro")}</p><a href="/organizer">{locale === "en" ? "Plan an event" : "Planlæg et arrangement"}</a> <a href="#forloeb">{t("learn")} ↓</a></div>
      <div className="illustration" aria-hidden="true"><CalendarDays size={140} strokeWidth={0.85}/><CircleCheck size={62} strokeWidth={1.1}/></div>
    </section>
    <section id="forloeb" className="steps" aria-label={t("learn")}>
      <article><ScanLine aria-hidden="true"/><h2>{t("share")}</h2><p>{t("shareText")}</p></article>
      <article><CalendarDays aria-hidden="true"/><h2>{t("choose")}</h2><p>{t("chooseText")}</p></article>
      <article><CircleCheck aria-hidden="true"/><h2>{t("gather")}</h2><p>{t("gatherText")}</p></article>
    </section>
  </main>;
}

