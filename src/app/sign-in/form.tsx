"use client";

import { createAuthClient } from "better-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const auth = createAuthClient();

export function SignInForm({en,google,reset}: {en:boolean;google:boolean;reset:boolean}) {
  const router = useRouter();
  const [mode,setMode] = useState<"login"|"register"|"forgot"|"reset">(reset?"reset":"login");
  const [message,setMessage] = useState("");
  const [pending,setPending] = useState(false);
  async function submit(form: FormData) {
    setPending(true);
    setMessage("");
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");
    try {
      if (mode === "forgot") {
        await auth.requestPasswordReset({email,redirectTo:window.location.origin+"/sign-in?reset=1"});
        setMessage(en?"Check your email for the reset link.":"Se efter nulstillingslinket i din indbakke.");
      } else if (mode === "reset") {
        const token = new URLSearchParams(window.location.search).get("token") ?? "";
        const result = await auth.resetPassword({token,newPassword:password});
        if (result.error) throw result.error;
        router.push("/sign-in");
      } else if (mode === "register") {
        const result = await auth.signUp.email({email,password,name:String(form.get("name")),callbackURL:"/organizer"});
        if (result.error) throw result.error;
        setMessage(en?"Check your email to verify your account.":"Bekræft din konto via linket i din indbakke.");
      } else {
        const result = await auth.signIn.email({email,password,callbackURL:"/organizer"});
        if (result.error) throw result.error;
        router.push("/organizer");
      }
    } catch {
      setMessage(en?"The request could not be completed. Check your details and email verification.":"Handlingen kunne ikke gennemføres. Tjek dine oplysninger, og bekræft din e-mail.");
    } finally {
      setPending(false);
    }
  }
  return <div className="stack">
    <form className="stack" action={submit}>
      {mode==="register" && <label>{en?"Name":"Navn"}<input name="name" required autoComplete="name"/></label>}
      {mode!=="reset" && <label>E-mail<input type="email" name="email" required autoComplete="email"/></label>}
      {mode!=="forgot" && <label>{en?"Password":"Adgangskode"}<input type="password" name="password" required minLength={12} maxLength={128} autoComplete={mode==="login"?"current-password":"new-password"}/></label>}
      <button disabled={pending}>{mode==="login"?(en?"Sign in":"Log ind"):mode==="register"?(en?"Create account":"Opret konto"):(en?"Reset password":"Nulstil adgangskode")}</button>
    </form>
    <button onClick={()=>{setMode(mode==="login"?"register":"login");setMessage("");}}>{mode==="login"?(en?"Create account":"Opret konto"):(en?"Sign in":"Log ind")}</button>
    <button onClick={()=>{setMode(new URLSearchParams(window.location.search).has("token")?"reset":"forgot");setMessage("");}}>{en?"Reset password":"Nulstil adgangskode"}</button>
    {google && <button onClick={()=>void auth.signIn.social({provider:"google",callbackURL:"/organizer"}).catch(()=>setMessage(en?"Google sign-in failed.":"Login med Google mislykkedes."))}>Google</button>}
    {message && <p role="status">{message}</p>}
  </div>;
}


