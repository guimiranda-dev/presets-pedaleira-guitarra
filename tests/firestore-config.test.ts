import { generateKeyPairSync } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  database: vi.fn(function (options: unknown) { return { options }; }), auth: vi.fn(function (options: unknown) { return { options }; }), jwt: vi.fn(function (options: unknown) { return { options }; }),
}));
vi.mock("@google-cloud/firestore", () => ({ Firestore: mocks.database }));
vi.mock("google-auth-library", () => ({ GoogleAuth: mocks.auth, JWT: mocks.jwt }));
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 1024, privateKeyEncoding: { type: "pkcs8", format: "pem" }, publicKeyEncoding: { type: "spki", format: "pem" } });
beforeEach(() => {
  vi.resetModules(); vi.clearAllMocks();
  vi.stubEnv("GOOGLE_CLOUD_PROJECT", "test-project"); vi.stubEnv("FIRESTORE_DATABASE_ID", "named-db");
  vi.stubEnv("GOOGLE_CLOUD_CLIENT_EMAIL", ""); vi.stubEnv("GOOGLE_CLOUD_PRIVATE_KEY", "");
});
afterEach(() => vi.unstubAllEnvs());
describe("autenticação do Firestore", () => {
  it("usa o objeto auth com ADC e não repassa credentials depreciado", async () => {
    const { getRepertoireDatabase } = await import("@/lib/server/firestore");
    getRepertoireDatabase(); getRepertoireDatabase();
    expect(mocks.database).toHaveBeenCalledTimes(1);
    expect(mocks.auth).toHaveBeenCalledWith({ projectId: "test-project" });
    expect(mocks.database.mock.calls[0][0]).not.toHaveProperty("credentials");
  });
  it("instancia JWT explícito e normaliza quebras de linha", async () => {
    vi.stubEnv("GOOGLE_CLOUD_CLIENT_EMAIL", "service@example.iam.gserviceaccount.com");
    vi.stubEnv("GOOGLE_CLOUD_PRIVATE_KEY", privateKey.replace(/\n/g, "\\n"));
    const { getRepertoireDatabase } = await import("@/lib/server/firestore"); getRepertoireDatabase();
    expect(mocks.jwt).toHaveBeenCalledWith(expect.objectContaining({ key: privateKey, scopes: ["https://www.googleapis.com/auth/cloud-platform"] }));
    expect(mocks.database.mock.calls[0][0]).not.toHaveProperty("credentials");
  });
  it("rejeita PEM inválido antes de tentar uma conexão", async () => {
    vi.stubEnv("GOOGLE_CLOUD_CLIENT_EMAIL", "service@example.iam.gserviceaccount.com");
    vi.stubEnv("GOOGLE_CLOUD_PRIVATE_KEY", "invalid-key");
    const { getRepertoireDatabase } = await import("@/lib/server/firestore");
    expect(() => getRepertoireDatabase()).toThrow("chave privada");
    expect(mocks.database).not.toHaveBeenCalled();
  });
});
