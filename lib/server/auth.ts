import "server-only";
import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { Timestamp } from "@google-cloud/firestore";
import { authConfig } from "@/config/auth";
import type { AuthUser } from "@/types/auth";
import { getRepertoireDatabase } from "./firestore";
import { allowedEmails, assertSameOrigin, authSecret, sessionCookieName } from "./auth-settings";
import { assertMailerConfigured, sendOtpEmail } from "./mail";
import { HttpError, logServiceError } from "./errors";

const digest = (value: string) => createHash("sha256").update(value).digest("hex");
const normalize = (email: string) => email.trim().toLowerCase();
const codeDigest = (email: string, challengeId: string, code: string) =>
  createHmac("sha256", authSecret()).update(`${email}:${challengeId}:${code}`).digest("hex");
const invalidCode = () => new HttpError(400, "Código inválido ou expirado. Solicite um novo código se necessário.");

export async function requestOtp(address: string) {
  const email = normalize(address);
  authSecret();
  const allowed = allowedEmails();
  assertMailerConfigured();
  if (!allowed.includes(email)) return;
  const code = String(randomInt(0, 10 ** authConfig.codeDigits)).padStart(authConfig.codeDigits, "0");
  const challengeId = randomBytes(16).toString("hex");
  const now = Date.now();
  const db = getRepertoireDatabase();
  const ref = db.collection("authChallenges").doc(digest(email));
  const reserved = await db.runTransaction(async (transaction) => {
    const existing = (await transaction.get(ref)).data();
    const sent: number[] = Array.isArray(existing?.sentAt)
      ? existing.sentAt.filter((time: unknown): time is number => typeof time === "number" && time > now - authConfig.sendWindowMs)
      : [];
    if (sent.length >= authConfig.maxSendsPerWindow || sent.some((time) => now - time < authConfig.resendIntervalMs)) return false;
    transaction.set(ref, {
      challengeId, codeHash: codeDigest(email, challengeId, code), attempts: 0, consumed: false,
      expiresAt: Timestamp.fromMillis(now + authConfig.codeLifetimeMs),
      deleteAt: Timestamp.fromMillis(now + authConfig.sendWindowMs),
      sentAt: [...sent, now],
    });
    return true;
  });
  if (!reserved) return;
  try {
    await sendOtpEmail(email, code);
  } catch (error) {
    try {
      await db.runTransaction(async (transaction) => {
        const current = (await transaction.get(ref)).data();
        if (current?.challengeId === challengeId) transaction.update(ref, { consumed: true });
      });
    } catch (cleanupError) { logServiceError("otp-invalidation", cleanupError); }
    if (error instanceof HttpError) throw error;
    throw new HttpError(503, "Não foi possível enviar o código. Aguarde um minuto e tente novamente.");
  }
}

export async function verifyOtp(address: string, code: string) {
  const email = normalize(address);
  if (!allowedEmails().includes(email)) throw invalidCode();
  authSecret();
  const now = Date.now();
  const db = getRepertoireDatabase();
  const challengeRef = db.collection("authChallenges").doc(digest(email));
  const token = randomBytes(32).toString("base64url");
  const sessionRef = db.collection("authSessions").doc(digest(token));
  const user: AuthUser = { uid: digest(email), email };
  const success = await db.runTransaction(async (transaction) => {
    const challenge = (await transaction.get(challengeRef)).data();
    if (!challenge || challenge.consumed || !(challenge.expiresAt instanceof Timestamp)
      || challenge.expiresAt.toMillis() <= now || challenge.attempts >= authConfig.maxAttempts
      || typeof challenge.challengeId !== "string" || typeof challenge.codeHash !== "string"
      || !/^[a-f0-9]{64}$/.test(challenge.codeHash)) return false;
    const candidate = Buffer.from(codeDigest(email, challenge.challengeId, code), "hex");
    const correct = timingSafeEqual(candidate, Buffer.from(challenge.codeHash, "hex"));
    if (!correct) {
      // Não lança dentro da transação: a tentativa errada precisa ser gravada.
      transaction.update(challengeRef, { attempts: challenge.attempts + 1 });
      return false;
    }
    transaction.update(challengeRef, { consumed: true });
    transaction.create(sessionRef, {
      ...user, createdAt: Timestamp.fromMillis(now),
      expiresAt: Timestamp.fromMillis(now + authConfig.sessionLifetimeMs),
    });
    return true;
  });
  if (!success) throw invalidCode();
  return { user, token };
}

function sessionToken(request: Request) {
  const name = sessionCookieName();
  const cookie = (request.headers.get("Cookie") ?? "").split(";")
    .map((entry) => entry.trim()).find((entry) => entry.startsWith(`${name}=`));
  const token = cookie?.slice(name.length + 1);
  return token && /^[A-Za-z0-9_-]{43}$/.test(token) ? token : null;
}

export async function requireUser(request: Request): Promise<AuthUser> {
  if (!["GET", "HEAD", "OPTIONS"].includes(request.method)) assertSameOrigin(request);
  const token = sessionToken(request);
  if (!token) throw new HttpError(401, "Entre com seu e-mail para acessar o repertório.");
  const session = (await getRepertoireDatabase().collection("authSessions").doc(digest(token)).get()).data();
  if (!session || !(session.expiresAt instanceof Timestamp) || session.expiresAt.toMillis() <= Date.now()
    || typeof session.email !== "string" || typeof session.uid !== "string"
    || session.uid !== digest(session.email) || !allowedEmails().includes(session.email)) {
    throw new HttpError(401, "Sua sessão expirou. Entre novamente com seu e-mail.");
  }
  return { uid: session.uid, email: session.email };
}

export async function revokeSession(request: Request) {
  const token = sessionToken(request);
  if (token) await getRepertoireDatabase().collection("authSessions").doc(digest(token)).delete();
}
