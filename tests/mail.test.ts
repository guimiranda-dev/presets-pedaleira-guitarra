import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ create: vi.fn(), send: vi.fn() }));
vi.mock("nodemailer", () => ({ default: { createTransport: mocks.create } }));
import { assertMailerConfigured, sendOtpEmail } from "@/lib/server/mail";
beforeEach(() => {
  vi.clearAllMocks(); mocks.create.mockReturnValue({ sendMail: mocks.send, close: vi.fn() }); mocks.send.mockResolvedValue({});
  vi.stubEnv("SMTP_HOST", "smtp.example.com"); vi.stubEnv("SMTP_PORT", "587"); vi.stubEnv("SMTP_SECURE", "false");
  vi.stubEnv("SMTP_USER", "user"); vi.stubEnv("SMTP_PASSWORD", "private-password"); vi.stubEnv("OTP_FROM_EMAIL", "login@example.com");
});
afterEach(() => vi.unstubAllEnvs());
describe("envio OTP por SMTP", () => {
  it("exige configuração completa e remetente válido", () => {
    expect(() => assertMailerConfigured()).not.toThrow();
    vi.stubEnv("SMTP_HOST", ""); expect(() => assertMailerConfigured()).toThrow();
    expect(mocks.send).not.toHaveBeenCalled();
  });
  it("exige STARTTLS e envia só ao endereço autorizado recebido", async () => {
    await sendOtpEmail("owner@example.com", "012345");
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ requireTLS: true, secure: false, logger: false, debug: false }));
    expect(mocks.send).toHaveBeenCalledWith(expect.objectContaining({ to: "owner@example.com", text: expect.stringContaining("012345") }));
    expect(mocks.send.mock.calls[0][0].text).not.toContain("private-password");
  });
  it("usa TLS direto na configuração da porta 465", async () => {
    vi.stubEnv("SMTP_PORT", "465"); vi.stubEnv("SMTP_SECURE", "true");
    await sendOtpEmail("owner@example.com", "012345");
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ port: 465, secure: true }));
  });
  it("identifica autenticação recusada pelo Gmail sem registrar segredo", async () => {
    vi.stubEnv("SMTP_HOST", "smtp.gmail.com");
    const logger = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.send.mockRejectedValue(Object.assign(new Error("private-password must not be logged"), { code: "EAUTH", responseCode: 535 }));
    await expect(sendOtpEmail("owner@example.com", "012345")).rejects.toMatchObject({ status: 503, message: expect.stringContaining("senha de app") });
    expect(JSON.stringify(logger.mock.calls)).not.toContain("private-password");
    expect(JSON.stringify(logger.mock.calls)).toContain("535");
  });

});
