"use server";

import { cookies } from "next/headers";

export async function setLanguage(form: FormData) {
  const locale = form.get("locale");
  if (locale !== "da" && locale !== "en") return;
  (await cookies()).set("locale", locale, {httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 31536000});
}
