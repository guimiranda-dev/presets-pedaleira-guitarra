import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Timestamp } from "@google-cloud/firestore";
const mocks = vi.hoisted(() => ({ database: vi.fn(), send: vi.fn(), mailReady: vi.fn() }));
vi.mock("@/lib/server/firestore", () => ({ getRepertoireDatabase: mocks.database }));
vi.mock("@/lib/server/mail", () => ({ sendOtpEmail: mocks.send, assertMailerConfigured: mocks.mailReady }));
import { requestOtp, requireUser, revokeSession, verifyOtp } from "@/lib/server/auth";

const email = "owner@example.com";
const rows = new Map<string, Record<string, unknown>>();
type Ref = { path: string; get: () => Promise<{ data: () => Record<string, unknown> | undefined }>; delete: () => Promise<void> };
function ref(path: string): Ref {
  return { path, get: async () => ({ data: () => rows.get(path) }), delete: async () => { rows.delete(path); } };
}
let queue: Promise<unknown>;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] }); vi.setSystemTime(new Date("2026-11-05T12:00:00Z"));
  vi.stubEnv("AUTH_ALLOWED_EMAILS", email); vi.stubEnv("AUTH_SECRET", "s".repeat(48));
  vi.stubEnv("APP_ORIGIN", "http://localhost:3000");
  rows.clear(); queue = Promise.resolve(); mocks.send.mockReset(); mocks.send.mockResolvedValue(undefined); mocks.mailReady.mockReset();
  mocks.database.mockReturnValue({
    collection: (collection: string) => ({ doc: (id: string) => ref(`${collection}/${id}`) }),
    runTransaction: (callback: (transaction: unknown) => Promise<unknown>) => {
      const operation = queue.then(async () => {
        const writes: (() => void)[] = [];
        const result = await callback({
          get: (document: Ref) => document.get(),
          set: (document: Ref, data: Record<string, unknown>) => writes.push(() => { rows.set(document.path, data); }),
          update: (document: Ref, data: Record<string, unknown>) => writes.push(() => { rows.set(document.path, { ...rows.get(document.path), ...data }); }),
          create: (document: Ref, data: Record<string, unknown>) => writes.push(() => { if (rows.has(document.path)) throw Error("exists"); rows.set(document.path, data); }),
        });
        writes.forEach((write) => write());
        return result;
      });
      queue = operation.catch(() => {});
      return operation;
    },
  });
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });
const sentCode = () => mocks.send.mock.calls.at(-1)![1] as string;
const sessionRequest = (token: string, method = "GET", origin = "http://localhost:3000") => new Request("http://localhost:3000/api/repertoire", {
  method, headers: { Cookie: `tonebook-session=${token}`, Origin: origin },
});

describe("OTP por e-mail", () => {
  it("envia seis dígitos e armazena apenas o hash do código", async () => {
    await requestOtp(email);
    expect(sentCode()).toMatch(/^\d{6}$/);
    const challenge = [...rows.values()][0];
    expect(challenge.codeHash).not.toBe(sentCode());
    expect(JSON.stringify(challenge)).not.toContain(`"${sentCode()}"`);
    expect(challenge.expiresAt).toBeInstanceOf(Timestamp);
  });
  it("não envia nem cria documentos para contas não autorizadas", async () => {
    await requestOtp("other@example.com");
    expect(mocks.send).not.toHaveBeenCalled(); expect(rows.size).toBe(0);
  });
  it("bloqueia reenvios antes de um minuto e limita cinco por hora", async () => {
    await requestOtp(email); await requestOtp(email);
    expect(mocks.send).toHaveBeenCalledTimes(1);
    for (let index = 0; index < 5; index++) { vi.setSystemTime(Date.now() + 61_000); await requestOtp(email); }
    expect(mocks.send).toHaveBeenCalledTimes(5);
  });
  it("recusa código expirado e impede reutilização após login", async () => {
    await requestOtp(email); const expired = sentCode();
    vi.setSystemTime(Date.now() + 600_000);
    await expect(verifyOtp(email, expired)).rejects.toMatchObject({ status: 400 });
    await requestOtp(email); const code = sentCode();
    await verifyOtp(email, code);
    await expect(verifyOtp(email, code)).rejects.toMatchObject({ status: 400 });
  });
  it("grava as tentativas erradas e bloqueia após cinco", async () => {
    await requestOtp(email); const code = sentCode(); const wrong = code === "000000" ? "111111" : "000000";
    for (let index = 0; index < 5; index++) await expect(verifyOtp(email, wrong)).rejects.toMatchObject({ status: 400 });
    expect([...rows.values()][0].attempts).toBe(5);
    await expect(verifyOtp(email, code)).rejects.toMatchObject({ status: 400 });
  });
  it("só permite um login mesmo com verificações simultâneas", async () => {
    await requestOtp(email); const code = sentCode();
    const results = await Promise.allSettled([verifyOtp(email, code), verifyOtp(email, code)]);
    expect(results.filter(({ status }) => status === "fulfilled")).toHaveLength(1);
    expect([...rows.keys()].filter((key) => key.startsWith("authSessions/"))).toHaveLength(1);
  });
  it("invalida o código quando o serviço de e-mail falha", async () => {
    mocks.send.mockRejectedValue(new Error("SMTP unavailable"));
    await expect(requestOtp(email)).rejects.toMatchObject({ status: 503 });
    await expect(verifyOtp(email, sentCode())).rejects.toMatchObject({ status: 400 });
  });
  it("recusa ambiente sem secret ou lista de contas autorizadas", async () => {
    vi.stubEnv("AUTH_SECRET", ""); await expect(requestOtp(email)).rejects.toMatchObject({ status: 503 });
    vi.stubEnv("AUTH_SECRET", "s".repeat(48)); vi.stubEnv("AUTH_ALLOWED_EMAILS", "");
    await expect(requestOtp(email)).rejects.toMatchObject({ status: 503 });
  });
});

describe("sessão do repertório", () => {
  it("exige cookie válido e não aceita Bearer como substituto", async () => {
    await expect(requireUser(new Request("http://localhost/api/repertoire", { headers: { Authorization: "Bearer fake" } }))).rejects.toMatchObject({ status: 401 });
    await expect(requireUser(sessionRequest("invalid"))).rejects.toMatchObject({ status: 401 });
  });
  it("restaura a identidade, verifica origem e revoga no logout", async () => {
    await requestOtp(email); const { token, user } = await verifyOtp(email, sentCode());
    expect(await requireUser(sessionRequest(token))).toEqual(user);
    await expect(requireUser(sessionRequest(token, "PUT", "https://other.example"))).rejects.toMatchObject({ status: 403 });
    expect(await requireUser(sessionRequest(token, "PUT"))).toEqual(user);
    await revokeSession(sessionRequest(token));
    await expect(requireUser(sessionRequest(token))).rejects.toMatchObject({ status: 401 });
  });
  it("recusa sessão expirada ou conta removida da lista", async () => {
    await requestOtp(email); const { token } = await verifyOtp(email, sentCode());
    vi.stubEnv("AUTH_ALLOWED_EMAILS", "other@example.com");
    await expect(requireUser(sessionRequest(token))).rejects.toMatchObject({ status: 401 });
    vi.stubEnv("AUTH_ALLOWED_EMAILS", email); vi.setSystemTime(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await expect(requireUser(sessionRequest(token))).rejects.toMatchObject({ status: 401 });
  });
});
