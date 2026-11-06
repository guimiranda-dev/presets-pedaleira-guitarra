import "server-only";
import { HttpError } from "./errors";

export function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) throw new HttpError(503, "O login ainda não foi configurado.");
  return secret;
}

export function allowedEmails() {
  const emails = (process.env.AUTH_ALLOWED_EMAILS ?? "")
    .split(",").map((email) => email.trim().toLowerCase()).filter(Boolean);
  if (!emails.length) throw new HttpError(503, "O acesso ao repertório ainda não foi configurado.");
  return emails;
}

export function assertSameOrigin(request: Request) {
  let origin: string;
  try {
    origin = new URL(process.env.APP_ORIGIN ?? "").origin;
  } catch {
    throw new HttpError(503, "O endereço da aplicação ainda não foi configurado.");
  }
  if (request.headers.get("Origin") !== origin) throw new HttpError(403, "Origem da requisição não autorizada.");
}

export function sessionCookieName() {
  return process.env.NODE_ENV === "production" ? "__Host-tonebook-session" : "tonebook-session";
}

export function sessionCookieOptions() {
  return { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
}
