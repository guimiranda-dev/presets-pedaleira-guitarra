import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ request: vi.fn(), verify: vi.fn(), revoke: vi.fn() }));
vi.mock("@/lib/server/auth", () => ({ requestOtp: mocks.request, verifyOtp: mocks.verify, revokeSession: mocks.revoke }));
import { POST as requestCode } from "@/app/api/auth/otp/request/route";
import { POST as verifyCode } from "@/app/api/auth/otp/verify/route";
import { POST as logout } from "@/app/api/auth/logout/route";
const post = (body: unknown, origin = "http://localhost:3000") => new Request("http://localhost:3000/api/auth", {
  method: "POST", headers: { Origin: origin }, body: JSON.stringify(body),
});
beforeEach(() => {
  vi.clearAllMocks(); vi.stubEnv("APP_ORIGIN", "http://localhost:3000");
  mocks.verify.mockResolvedValue({ user: { uid: "owner", email: "owner@example.com" }, token: "t".repeat(43) });
});
afterEach(() => vi.unstubAllEnvs());
describe("rotas OTP", () => {
  it("normaliza o e-mail e retorna mensagem sem revelar autorização", async () => {
    const response = await requestCode(post({ email: "Owner@Example.com" }));
    expect(response.status).toBe(202); expect(mocks.request).toHaveBeenCalledWith("owner@example.com");
    expect(await response.json()).toHaveProperty("message");
  });
  it("recusa origem externa, e-mail inválido e código malformado", async () => {
    expect((await requestCode(post({ email: "owner@example.com" }, "https://attacker.example"))).status).toBe(403);
    expect((await requestCode(post({ email: "not-email" }))).status).toBe(400);
    expect((await verifyCode(post({ email: "owner@example.com", code: "123" }))).status).toBe(400);
    expect(mocks.verify).not.toHaveBeenCalled();
  });
  it("entrega a sessão só em cookie HttpOnly e SameSite", async () => {
    const response = await verifyCode(post({ email: "owner@example.com", code: "012345" }));
    expect(response.status).toBe(200);
    const cookie = response.headers.get("set-cookie");
    expect(cookie).toContain("HttpOnly"); expect(cookie).toContain("SameSite=lax");
    expect(await response.json()).toEqual({ user: { uid: "owner", email: "owner@example.com" } });
  });
  it("usa cookie Secure e prefixo Host em produção e limpa no logout", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const response = await verifyCode(post({ email: "owner@example.com", code: "012345" }));
    expect(response.headers.get("set-cookie")).toContain("__Host-tonebook-session=");
    expect(response.headers.get("set-cookie")).toContain("Secure");
    expect((await logout(post({}))).headers.get("set-cookie")).toContain("Max-Age=0");
    expect(mocks.revoke).toHaveBeenCalled();
  });
});
