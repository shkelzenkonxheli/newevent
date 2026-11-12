import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import "./styles.css";

export async function generateMetadata(): Promise<Metadata> {
  const en = await getLocale()==="en";
  return {title:"NewEvent",description:en?"Plan an event together with date and activity voting.":"Planlæg et arrangement sammen med afstemning om datoer og aktiviteter."};
}

export default async function Layout({children}: {children: ReactNode}) {
  return <html lang={await getLocale()}><body>{children}</body></html>;
}

