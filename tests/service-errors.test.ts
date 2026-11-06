import { describe, expect, it, vi } from "vitest";
import { errorResponse } from "@/lib/server/errors";

describe("diagnóstico seguro de serviços", () => {
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
