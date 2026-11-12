import { createHash, randomBytes } from "node:crypto";

export function createCapability() {
  return randomBytes(32).toString("base64url");
}

export function hashCapability(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
