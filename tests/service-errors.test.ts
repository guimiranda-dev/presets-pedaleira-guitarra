import { afterEach, describe, expect, it, vi } from "vitest";
import { errorResponse } from "@/lib/server/errors";

afterEach(() => vi.unstubAllEnvs());

describe("diagnóstico seguro de serviços", () => {
  it("expõe mensagem de serialização útil quando não há código de serviço", () => {
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    errorResponse(new Error('Could not serialize object of type "Timestamp"'), "otp-request");
    expect(JSON.stringify(logger.mock.calls)).toContain("Timestamp");
  });
  it("remove segredos configurados e e-mails das mensagens de diagnóstico", () => {
    vi.stubEnv("SMTP_PASSWORD", "sensitive-value-123");
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    errorResponse(new Error("Unexpected data sensitive-value-123 from owner@example.com"));
    expect(JSON.stringify(logger.mock.calls)).not.toContain("sensitive-value-123");
    expect(JSON.stringify(logger.mock.calls)).not.toContain("owner@example.com");
  });
  it("identifica ADC ausentes sem registrar a mensagem original", async () => {
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = errorResponse(new Error("Could not load the default credentials. private-information"), "otp-request");
    expect((await response.json()).error).toContain("não estão disponíveis");
    expect(JSON.stringify(logger.mock.calls)).toContain("GCP_CREDENTIALS_MISSING");
    expect(JSON.stringify(logger.mock.calls)).not.toContain("private-information");
  });
  it("identifica credenciais recusadas e preserva apenas metadados seguros", async () => {
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = Object.assign(new Error("private-key-content"), { response: { status: 400, data: { error: "invalid_grant", error_description: "private-key-content" } } });
    const response = errorResponse(error, "otp-request");
    expect((await response.json()).error).toContain("mesma conta");
    expect(JSON.stringify(logger.mock.calls)).toContain("GCP_CREDENTIALS_REJECTED");
    expect(JSON.stringify(logger.mock.calls)).not.toContain("private-key-content");
  });
  it.each([
    [7, "permissão"],
    [5, "não foi encontrado"],
    [16, "credenciais"],
  ])("identifica falhas do Firestore com código %s", async (code, expected) => {
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    const error = Object.assign(new Error("PRIVATE KEY or token must not appear"), { code });
    const response = errorResponse(error);
    expect(response.status).toBe(503);
    expect((await response.json()).error.toLowerCase()).toContain(expected);
    expect(JSON.stringify(logger.mock.calls)).not.toContain("PRIVATE KEY");
    expect(JSON.stringify(logger.mock.calls)).toContain(`"code":${code}`);
  });
});
