import { expect, test, vi } from "vitest";
import { createCapability } from "./capability";
import { getDb } from "./db";

const mail = vi.hoisted(()=>({send:vi.fn<(_message:{to:string;text:string})=>Promise<{error:null}>>(async ()=>({error:null}))}));
vi.mock("resend",()=>({Resend:class { emails=mail; }}));

test.skipIf(process.env.NEWEVENT_DATABASE_TEST !== "1")("password sign-in requires email verification", async ()=>{
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl || !["localhost","127.0.0.1","[::1]"].includes(new URL(dbUrl).hostname)) {
    throw new Error("Use a dedicated local PostgreSQL database for this test");
  }
  const origin = "http://localhost:3000";
  vi.stubEnv("BETTER_AUTH_URL",origin);
  vi.stubEnv("BETTER_AUTH_SECRET",createCapability());
  vi.stubEnv("RESEND_API_KEY","unit-test-mail-adapter");
  vi.stubEnv("EMAIL_FROM","test@example.invalid");
  const {getAuth} = await import("./auth");
  const auth = getAuth();
  const email = createCapability().toLowerCase()+"@example.invalid";
  const password = createCapability();
  const request = (path:string, data:object) => auth.handler(new Request(origin+"/api/auth/"+path,{
    method:"POST",headers:{"content-type":"application/json",origin},body:JSON.stringify(data),
  }));
  const db = getDb();
  try {
    const signup = await request("sign-up/email",{email,password,name:"NewEvent test"});
    expect(signup.status).toBe(200);
    expect((await request("sign-in/email",{email,password})).status).toBe(403);
    await vi.waitFor(()=>expect(mail.send).toHaveBeenCalled());
    const message = mail.send.mock.calls.find(([message])=>message.to===email)?.[0];
    const url = message?.text.split("\n\n").at(-1);
    if (!url) throw new Error("Verification message was not sent");
    await auth.handler(new Request(url));
    expect((await db.user.findUnique({where:{email}}))?.emailVerified).toBe(true);
    const signedIn = await request("sign-in/email",{email,password});
    expect(signedIn.status).toBe(200);
    expect(signedIn.headers.get("set-cookie")).toContain("session_token");
  } finally {
    await db.user.deleteMany({where:{email}});
    await db.$disconnect();
    vi.unstubAllEnvs();
  }
},30000);


