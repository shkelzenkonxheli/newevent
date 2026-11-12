import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const messages = {
  da: {lead: "Gode planer starter sammen.", intro: "Find en dag, der passer gruppen. Saml idéerne, og giv alle en stemme med ét link.", learn: "Se hvordan det virker", share: "Del ét link", shareText: "Invitér gruppen med ét link eller en QR-kode.", choose: "Find det, der passer", chooseText: "Foreslå datoer og aktiviteter, og stem på flere muligheder.", gather: "Saml gruppen", gatherText: "Meld den endelige plan ud, og få svar på, hvem der kommer."},
  en: {lead: "Good plans start together.", intro: "Find a day that works for the group. Gather ideas and give everyone a vote with one link.", learn: "See how it works", share: "Share one link", shareText: "Invite the group with a link or QR code.", choose: "Find what works", chooseText: "Suggest dates and activities, and vote for multiple options.", gather: "Bring everyone together", gatherText: "Announce the final plan and find out who's coming."},
};

export default getRequestConfig(async () => {
  const locale = (await cookies()).get("locale")?.value === "en" ? "en" : "da";
  return {locale, messages: messages[locale]};
});

