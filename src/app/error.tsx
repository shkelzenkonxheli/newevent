"use client";

import { useEffect, useState } from "react";

export default function ErrorPage({reset}:{reset:()=>void}) {
  const [en,setEn] = useState(false);
  useEffect(()=>{
    const frame = requestAnimationFrame(()=>setEn(document.documentElement.lang==="en"));
    return ()=>cancelAnimationFrame(frame);
  },[]);
  return <main className="shell"><header>NewEvent</header><section className="event-card stack">
    <h1>{en?"Something went wrong":"Noget gik galt"}</h1>
    <p role="alert">{en?"Check your input and try again.":"Tjek dine oplysninger, og prøv igen."}</p>
    <button onClick={reset}>{en?"Try again":"Prøv igen"}</button>
  </section></main>;
}
