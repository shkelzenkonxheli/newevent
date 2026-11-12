"use server";

import { revalidatePath } from "next/cache";
import { allowPublicWrite } from "../../../server/public-limit";
import { EventError, saveBallot } from "../../../server/ballots";

export type VoteState = { code?: string; privateToken?: string; saved?: boolean };

export async function vote(token: string, _previous: VoteState, form: FormData): Promise<VoteState> {
  const lines = (name: string) => String(form.get(name) ?? "").split(/\r?\n/u).map(value => value.trim()).filter(Boolean);
  try {
    if (!await allowPublicWrite(token)) return {code:"limited"};
    const result = await saveBallot(token, {
      name: String(form.get("name") ?? ""),
      privateToken: String(form.get("privateToken") ?? "").trim() || undefined,
      dateIds: form.getAll("date").map(String),
      ideaIds: form.getAll("idea").map(String),
      newDates: lines("newDates"),
      newIdeas: lines("newIdeas"),
    });
    revalidatePath("/e/" + token);
    return {...result, saved: true};
  } catch (error) {
    return {code: error instanceof EventError ? error.code : "unexpected"};
  }
}

