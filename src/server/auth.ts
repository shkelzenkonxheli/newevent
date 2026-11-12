import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { headers } from "next/headers";
import { Resend } from "resend";
import { getDb } from "./db";

async function sendLink(email: string, url: string, purpose: "verify" | "reset", request?: Request) {
  const english = /(?:^|;\s*)locale=en(?:;|$)/u.test(request?.headers.get("cookie") ?? "");
  const subject = purpose === "verify"
    ? english ? "Verify your NewEvent email" : "Bekræft din e-mail til NewEvent"
    : english ? "Reset your NewEvent password" : "Nulstil din adgangskode til NewEvent";
  if (process.env.NODE_ENV === "development" && process.env.EMAIL_MODE === "console") {
    console.info(subject, url);
    return;
  }
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) throw new Error("Email delivery is not configured");
  const { error } = await new Resend(apiKey).emails.send({ from, to: email, subject, text: subject + "\n\n" + url });
  if (error) throw new Error("Email delivery failed");
}

function configureAuth() {
  const baseURL = process.env.BETTER_AUTH_URL;
  const secret = process.env.BETTER_AUTH_SECRET;
  if (!baseURL || !secret || secret.length < 32) throw new Error("Set BETTER_AUTH_URL and a strong BETTER_AUTH_SECRET");
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  return betterAuth({
    baseURL,
    secret,
    database: prismaAdapter(getDb(), {provider: "postgresql", transaction: true}),
    socialProviders: clientId && clientSecret ? {google: {clientId, clientSecret}} : {},
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 12,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user, url }, request) => sendLink(user.email, url, "reset", request),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      sendVerificationEmail: async ({ user, url }, request) => sendLink(user.email, url, "verify", request),
    },
  });
}

let auth: ReturnType<typeof configureAuth> | undefined;

export function getAuth() {
  return auth ??= configureAuth();
}

export async function verifiedOrganizer() {
  const session = await getAuth().api.getSession({headers: await headers()});
  return session?.user.emailVerified ? session.user : null;
}
