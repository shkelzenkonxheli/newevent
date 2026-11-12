import { getLocale } from "next-intl/server";

export default async function Privacy() {
  const en = await getLocale()==="en";
  return <main className="shell"><header>NewEvent</header><section className="event-card">
    <h1>{en?"Privacy":"Privatliv"}</h1>
    <p>{en?"We use your name, choices and attendance reply to help the organizer plan the event. The organizer can see individual replies and export or delete event data. Other participants can see proposals and the final plan. Avoid including personal details in proposals.":"Vi bruger dit navn, dine valg og dit svar til at hjælpe arrangøren med at planlægge arrangementet. Arrangøren kan se individuelle svar og eksportere eller slette arrangementets data. Andre deltagere kan se forslag og den endelige plan. Undgå at skrive personlige oplysninger i forslag."}</p>
    <p>{en?"A name is not proof of identity. Keep your private code safe to update your reply. Contact your organizer for help with access or deletion.":"Et navn beviser ikke din identitet. Gem din private kode, så du kan ændre dit svar. Kontakt arrangøren, hvis du har brug for indsigt eller sletning."}</p>
  </section></main>;
}
